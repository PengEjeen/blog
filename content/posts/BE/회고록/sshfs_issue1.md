---
title: sshfs 로그 마운트 장애로 발생한 Nginx 무응답 및 Docker 제어 실패
date: 2026-04-13
---

sshfs를 통해 웹 서버가 NAS에 로그를 기록하는 구조로 운영되고 있었다.
하지만 sshfs 연결이 비정상적으로 끊어지면서, nginx가 로그를 기록하던 경로에 접근하지 못하는 상황이 발생하였다.

## **문제상황**

**nginx 자체 문제가 아니라, nginx가 로그를 쓰던 `sshfs` 마운트가 멈추면서 nginx worker들이 커널 `D` 상태(Uninterruptible sleep) 에 빠진 장애**였다.
 그 결과 컨테이너는 `Up`으로 보였지만 실제로는 응답 불가였고, Docker도 종료 이벤트를 받지 못해 `restart`, `rm -f`가 실패했다.

## **근거**

먼저 nginx 컨테이너에는 이 마운트가 붙어 있었다.  
 `/home/p6consul/mnt/nas_logs -> /home/p6consul/mnt/nas_logs` 그리고 이 경로는 실제로 `sshfs` 마운트였다. 즉 원격 서버 `115.68.14.113`의 로그 경로를 로컬에 붙여 쓴 구조였다.

그리고 커널 로그에는 nginx task가 120초 넘게 block되었다고 반복해서 찍혔다. 스택도 `ksys_write`, `__x64_sys_write` 쪽이라서, nginx가 **무언가에 write 하다가** 빠져나오지 못한 상황으로 보인다. 단순 CPU 루프나 네트워크 accept 문제가 아니라 **출력/쓰기 경로에서 멈춘 것**이다.

여기에 더해:

* `ps`에서 nginx worker 다수가 `D` 상태였다  
* `docker restart pmis_nginx`가 `did not receive an exit event`로 실패했다  
* `docker rm -f pmis_nginx`도 같은 이유로 실패했다  
* `df -h`까지 멈췄다

이 조합은 보통 **죽은 네트워크 파일시스템이나 hung mount**를 건드릴 때 나온다. `df -h`가 멈춘 것도 모든 마운트를 조회하다 `sshfs` 쪽에서 block된 것으로 설명된다.

마지막으로, `sudo umount -l /home/p6consul/mnt/nas_logs`를 한 뒤 서비스가 다시 살아났다는 점이 있다.  
 즉 **원인 리소스를 떼어내자 block이 풀렸고**, nginx와 Docker 제어가 다시 가능해진 것이다.

## **장애 메커니즘**

흐름을 짧게 쓰면 이렇다.

1. nginx 컨테이너가 로그를 `nas_logs` 경로로 쓰고 있었음  
2. 그 경로는 `sshfs`로 붙은 원격 NAS/로그 저장소였음  
3. 원격 스토리지 또는 sshfs 세션이 비정상 상태가 됨  
4. nginx worker가 로그 write 중 block  
5. 프로세스가 `D` 상태로 고착  
6. 컨테이너는 살아 있는 것처럼 보이지만 요청 처리 불가  
7. Docker도 해당 프로세스를 종료시키지 못함  
8. lazy unmount 후 block 원인이 제거되며 복구

## **왜 nginx만 이렇게 심하게 망가졌나**

nginx는 요청마다 access log, 에러 시 error log를 자주 쓴다.  
 즉 로그 경로가 죽으면 가장 먼저 크게 티가 난다. 이번 커널 스택도 write 경로였기 때문에, nginx가 트래픽 처리 중 로그를 쓰다가 막힌 걸로 보는 게 자연스럽다.

## 

## **문제해결**

기존 구조에서는 nginx 컨테이너가 sshfs로 마운트된 NAS 경로에 로그를 직접 기록하고 있었다. 이 방식은 원격 NAS 또는 sshfs 연결에 문제가 생길 경우, nginx의 로그 write 작업이 block될 수 있고 서비스 프로세스까지 영향을 받을 수 있는 구조였다.

따라서 로그 기록 방식은 다음과 같이 변경한다.

nginx는 더 이상 NAS 마운트 경로에 직접 로그를 쓰지 않고, 서버 로컬 디스크에 로그를 우선 기록한다. 이후 별도 스크립트나 cron 작업을 통해 로컬에 쌓인 로그 파일을 rsync로 NAS 서버에 주기적으로 전송한다.

이 구조로 변경하면 NAS 연결 장애가 발생하더라도 nginx는 로컬 디스크에 계속 로그를 기록할 수 있으므로, 원격 스토리지 장애가 웹 서비스 장애로 전파되는 것을 막을 수 있다. 또한 rsync 전송 실패는 로그 동기화 지연 문제로만 남게 되며, nginx 요청 처리나 Docker 컨테이너 제어에는 직접적인 영향을 주지 않는다.