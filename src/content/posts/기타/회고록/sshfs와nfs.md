---
title: nas 마운트 프로토콜 sshfs에서 nfs로 변환 이유
date: 2026-05-28
---

1. 이전 sshfs 로그 마운트 장애로 발생한 nginx 무응답 문제 때문에 다른 안정적인 프로토콜 찾아봄
2. nas 프로토콜로 sshfs nfs smb 비교
3. nfs 선택이유 server와 nas 둘 다 linux 기반이라서
4. 세팅방법
5. nfs-kernel-server설치부터 방화벽 포트고정 열기, nc nv로 먼저 테스트, 마운트 시도