---
title: 디렉터리 스캔이 만든 렉을 TTL 캐시로 걷어낸 이야기
date: 2026-04-30
---

## 문제 상황

워크스페이스 선택 화면에 "이 워크스페이스가 지금 얼마나 용량을 쓰고 있는지"를 함께 보여주기로 했다.
사용자가 어느 워크스페이스로 들어갈지 결정할 때, 남은 저장 공간이 얼마나 되는지 한눈에 보이면 좋겠다는 단순한 요구였다.

기능을 붙이고 보니, **선택 화면 진입 자체가 눈에 띄게 느려졌다.**
워크스페이스 수가 적을 때는 티가 안 났는데, 워크스페이스가 늘고 그 안의 파일이 많아질수록 점점 더 무거워졌다.

## 원인을 찾아보니 — 매번 디렉터리를 통째로 훑고 있었다

API에서 워크스페이스 목록을 내려줄 때, 각 워크스페이스마다 이런 식으로 저장용량을 계산하고 있었다.

```python
"storage": get_workspace_storage_summary(w.id)
```

문제는 `get_workspace_storage_summary()`가 **호출될 때마다** `STORAGE_ROOT/workspace/<workspace_id>` 아래의 모든 파일을 재귀적으로 돌면서 크기를 합산하고 있었다는 것이다.

즉, 워크스페이스 N개 × 파일 M개 = 매 요청마다 N×M 번의 디스크 I/O가 발생하는 구조였다.
선택 화면을 한 번 열 뿐인데 디스크가 꽤 시끄러웠다.

저장용량은 사실 **매 순간 정확할 필요까지는 없는 값**이다.
사용자에게 "지금 약 60% 사용 중" 정도로 보이기만 하면 충분하고, 1~2분 전 값이라도 큰 문제가 없다.
그렇다면 매 요청마다 다시 계산할 필요는 없다는 뜻이다.

## 해결 — TTL 캐시로 표시값을 잠시 보관하기

Django의 캐시 프레임워크를 써서 TTL 캐시를 적용했다.

```python
from django.core.cache import cache

WORKSPACE_STORAGE_CACHE_TIMEOUT_SECONDS = 300
WORKSPACE_STORAGE_SUMMARY_CACHE_KEY = "workspace-storage-summary:{workspace_id}"
WORKSPACE_STORAGE_USAGE_CACHE_KEY = "workspace-storage-usage:{workspace_id}"
```

요약 조회 함수는 먼저 캐시를 확인하고, 캐시가 없을 때만 실제 디렉터리를 스캔하도록 바꿨다.

```python
def get_workspace_storage_summary(workspace_id: str) -> dict:
    cache_key = WORKSPACE_STORAGE_SUMMARY_CACHE_KEY.format(workspace_id=workspace_id)
    cached = cache.get(cache_key)

    if cached is not None:
        return cached

    dir_totals = _collect_workspace_directory_usage(workspace_id, {})
    quota_bytes = _get_workspace_quota_bytes(workspace_id)

    summary = {
        "quota_bytes": quota_bytes,
        "usage_bytes": dir_totals["bytes"],
        "usage_percent": _calculate_usage_percent(
            dir_totals["bytes"],
            quota_bytes,
        ),
    }

    cache.set(cache_key, summary, WORKSPACE_STORAGE_CACHE_TIMEOUT_SECONDS)
    return summary
```

상세 조회 함수도 동일한 패턴으로 캐시했다.

```python
def get_workspace_storage_usage(workspace_id: str) -> dict:
    cache_key = WORKSPACE_STORAGE_USAGE_CACHE_KEY.format(workspace_id=workspace_id)
    cached = cache.get(cache_key)

    if cached is not None:
        return cached

    # 실제 DB 참조 파일 + 디렉터리 스캔
    ...
    cache.set(cache_key, usage, WORKSPACE_STORAGE_CACHE_TIMEOUT_SECONDS)
    return usage
```

TTL은 **5분**으로 잡았다.

```python
WORKSPACE_STORAGE_CACHE_TIMEOUT_SECONDS = 300
```

5분이라는 숫자에 거창한 근거가 있는 건 아니다.
"화면을 잠깐 열고 들어갔다 나오는 일반적인 사용 흐름에서, 사용자가 같은 정보를 다시 볼 때까지 걸리는 시간"을 가늠해서 정한 값이다.
너무 짧으면 캐시 의미가 없고, 너무 길면 표시값이 실제와 너무 동떨어진다.

## 그런데 캐시는 곧 정합성 문제

여기까지만 두면, 사용자가 파일을 업로드해도 선택 화면에는 5분 동안 "변하지 않은 용량"이 보일 수 있다.
표시값이 빠른 건 좋지만, 본인이 방금 한 행동이 화면에 반영되지 않는 건 명백한 버그처럼 느껴진다.

그래서 **저장용량이 실제로 바뀌는 이벤트에서는 해당 워크스페이스의 캐시를 즉시 삭제**했다.

```python
def delete_workspace_storage_cache(workspace_id: str) -> None:
    cache.delete(WORKSPACE_STORAGE_SUMMARY_CACHE_KEY.format(workspace_id=workspace_id))
    cache.delete(WORKSPACE_STORAGE_USAGE_CACHE_KEY.format(workspace_id=workspace_id))
```

업로드 성공 직후:

```python
saved_name = super().save(name, content, max_length=max_length)

if workspace_id:
    delete_workspace_storage_cache(workspace_id)

return saved_name
```

파일 삭제 직후:

```python
def delete(self, name):
    workspace_id = _get_workspace_id_from_path(name)

    super().delete(name)

    if workspace_id:
        delete_workspace_storage_cache(workspace_id)
```

관리자가 quota를 변경했을 때도 마찬가지로 캐시를 비워준다.

```python
WorkspaceQuota.objects.update_or_create(
    workspace=workspace,
    defaults={"storage_limit_bytes": storage_limit_bytes},
)

delete_workspace_storage_cache(workspace.pk)
```

이렇게 하면 **TTL은 안전망**으로 두고, **실제 변화 이벤트가 일어날 때마다 능동적으로 캐시를 무효화**하는 구조가 된다.

## 한 가지 더 — "표시"와 "차단"은 다른 기준을 쓴다

저장용량 캐시를 도입할 때 한 가지 더 신경 쓴 부분이 있다.

**업로드 차단 로직(쿼터 초과 검사)에는 캐시를 사용하지 않았다.**

이유는 단순하다. 표시값은 "대략 얼마쯤 썼는가"를 보여주는 용도라서 약간 오래된 값이어도 괜찮지만,
업로드 차단은 "지금 이 파일을 받으면 한도를 넘는가"를 결정하는 일이라 **실시간으로 정확해야** 한다.

캐시된 값이 5분 전 데이터라면, 그 사이에 다른 업로드가 있었던 경우 한도를 초과한 채로 업로드를 허용해버릴 수 있다.

그래서 같은 도메인 안에서도 두 가지 흐름을 분리해두었다.

- **표시용 조회**: TTL 캐시 사용. 빠르고, 약간의 지연 허용.
- **차단용 조회**: 캐시 우회. 항상 실제 디렉터리 기준으로 계산.

## 정리하면

이번 작업의 핵심은 다음 네 가지다.

- 워크스페이스 선택 화면은 캐시된 저장용량을 사용한다.
- 첫 조회 또는 캐시 만료 시에만 실제 디렉터리를 스캔한다.
- 업로드, 삭제, quota 변경 시에는 캐시를 즉시 무효화한다.
- 업로드 차단 로직은 캐시를 사용하지 않고 실제 디렉터리 기준으로 검사한다.

따라서 표시값은 빠르게 제공하면서도, 실제 제한 초과 여부는 더 보수적으로 판단할 수 있다.

## 회고

처음 이 문제를 만났을 때는 "캐싱하면 되겠지" 정도로 가볍게 생각했는데, 막상 적용해보니 **캐싱은 결국 정합성 설계 문제**라는 걸 다시 한 번 느꼈다.

TTL을 거는 것 자체는 한 줄이면 끝나지만, 그 한 줄 뒤에는

- 어떤 이벤트에서 캐시를 깨야 하는가
- 어떤 흐름은 캐시를 써도 되고, 어떤 흐름은 절대 안 되는가
- TTL이 만료되기 전까지의 시간 동안 사용자에게 어떤 모습으로 보이는가

같은 질문들이 줄줄이 따라온다.

이번 케이스에서는 "표시"와 "차단"을 다른 채널로 분리한 게 가장 만족스러운 설계 결정이었다.
같은 데이터처럼 보여도, 그 데이터를 **소비하는 목적이 다르면 정확도 요구사항도 다르다**는 사실을 코드 구조에 녹여낼 수 있었다.
