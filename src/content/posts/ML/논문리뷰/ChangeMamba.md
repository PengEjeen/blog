---
title: "ChangeMamba 논문 리뷰: 변화 탐지에 Mamba를 어떻게 적용했나"
date: 2026-10-28
---

# ChangeMamba 논문 리뷰: 변화 탐지에 Mamba를 어떻게 적용했나

> **요약**: ChangeMamba는 두 시점의 원격 탐사 영상을 공유 가중치의 VMamba 인코더로 처리하고, 변화 디코더에서 두 시점의 특징을 세 가지 순서로 배열해 시공간 관계를 학습한다. 이 구성을 이진 변화 탐지, 의미 변화 탐지, 건물 피해 평가에 적용했다. 논문은 다섯 데이터셋에서 강한 성능을 보고하지만, 연산량과 실제 추론 속도는 구분해서 읽어야 한다. [논문 원문](https://arxiv.org/html/2404.03425)

## 어떤 문제를 푸는 논문인가

원격 탐사 변화 탐지(Change Detection)는 같은 지역을 다른 시점에 촬영한 영상 두 장에서 무엇이 달라졌는지 찾는 문제다. 건물이 새로 생겼는지, 토지 피복이 어떻게 바뀌었는지, 재난 뒤 건물이 얼마나 손상됐는지처럼 원하는 답에 따라 과제가 달라진다. ChangeMamba는 이를 **이진 변화 탐지(BCD)**, **의미 변화 탐지(SCD)**, **건물 피해 평가(BDA)** 세 가지로 나눠 다룬다. [논문 §III-B](https://arxiv.org/html/2404.03425#S3.S2)

두 영상을 각각 잘 표현하는 것만으로는 충분하지 않다. 어느 위치의 변화가 실제 지표 변화이고 어느 부분이 촬영 조건의 차이인지 판단하려면, 두 시점의 특징을 비교하는 과정이 필요하다. 이 논문의 핵심은 그 비교 과정에 **상태 공간 모델의 순차 처리 방식**을 적용한 데 있다. [논문 §III-E](https://arxiv.org/html/2404.03425#S3.S5)

## 모델 구조

```text
시점 T1 영상 ─┐
              ├─ 공유 VMamba 인코더 ─ 다중 해상도 특징 ─ 변화 디코더 ─ 변화 지도
시점 T2 영상 ─┘                              └─ 과제별 의미 디코더
```

두 영상은 **가중치를 공유하는 Siamese VMamba 인코더**를 지난다. 인코더는 네 단계에서 서로 다른 해상도의 특징을 만든다. VMamba의 2D cross-scan은 영상을 한 방향으로만 펼쳐 처리할 때 생기는 공간 정보의 편향을 줄이기 위해 네 방향으로 토큰을 주사하고 결과를 합친다. 논문이 말하는 선형 복잡도는 이 선택적 상태 공간 연산의 토큰 길이에 대한 성질이다. [논문 §III-C–D](https://arxiv.org/html/2404.03425#S3.S3)

세 과제는 인코더와 변화 디코더의 기본 구조를 공유하되 출력이 다르다. [논문 §III-C](https://arxiv.org/html/2404.03425#S3.S3)

| 모델 | 예측하는 것 | 추가 분기 |
| --- | --- | --- |
| MambaBCD | 변화 여부를 나타내는 이진 지도 | 없음 |
| MambaSCD | 변화 지도와 두 시점의 토지 피복 지도 | 시점별 의미 디코더 2개 |
| MambaBDA | 재난 전 건물 위치와 재난 후 피해 등급 | 건물 위치 디코더 1개 |

### 핵심: 두 시점의 토큰을 세 방식으로 결합

변화 디코더의 **STSS(Spatio-Temporal State Space) 블록**은 각 시점에서 뽑은 특징을 세 방식으로 재배열한 뒤 각각 VSS 블록에 넣는다. 위치 `i`의 두 시점 특징을 `T1[i]`, `T2[i]`라고 쓰면 다음과 같다. [논문 §III-E.1–2](https://arxiv.org/html/2404.03425#S3.S5)

```text
Sequential: T1[1], T1[2], …, T2[1], T2[2], …
Cross:      T1[1], T2[1], T1[2], T2[2], …
Parallel:   concat_channel(T1, T2) → 공간 토큰 시퀀스
```

Sequential은 시점별 공간 맥락을 먼저 이어 붙이고, Cross는 같은 위치의 전후 특징을 이웃하게 두며, Parallel은 두 시점의 채널을 결합한다. **이 해석은 토큰 배열에 근거한 직관**이다. 세 방식의 이득을 각각 다른 정보의 학습으로 엄밀히 분해해 입증한 것은 아니다. 디코더는 이 블록의 출력을 이전 단계의 특징과 융합하고 업샘플링하며 최종 지도를 만든다. [논문 §III-E](https://arxiv.org/html/2404.03425#S3.S5)

손실 함수는 BCD에서 cross-entropy와 Lovász-Softmax를 더하고, SCD와 BDA에서는 각 출력 분기의 손실을 합친다. 저자들은 focal loss나 deep supervision 같은 추가 학습 기법은 사용하지 않았다고 밝힌다. [논문 §III-F](https://arxiv.org/html/2404.03425#S3.S6)

## 실험 결과를 어떻게 읽을까

논문은 BCD에 SYSU-CD·LEVIR-CD+·WHU-CD, SCD에 SECOND, BDA에 xBD를 사용한다. 아래 값은 **논문이 보고한 결과**이며, 별도로 재현한 수치가 아니다. 지표가 다른 과제의 점수를 한 줄로 비교할 수 없도록 데이터셋별 대표 지표를 적었다. [논문 §IV-A–D](https://arxiv.org/html/2404.03425#S4)

| 과제·데이터셋 | ChangeMamba 계열 결과 | 논문의 비교 모델 | 읽을 점 |
| --- | ---: | ---: | --- |
| BCD · SYSU-CD, F1 | MambaBCD-Base **83.11** | SwinSUNet 81.58 | 범주를 특정하지 않은 변화 탐지 |
| BCD · LEVIR-CD+, F1 | MambaBCD-Base **88.39** | SwinSUNet 85.60 | 건물 변화 탐지 |
| BCD · WHU-CD, F1 | MambaBCD-Base **94.19** | SwinSUNet 93.04 | 건물 변화 탐지 |
| SCD · SECOND, SeK | MambaSCD-Base **22.92** | ScanNet 21.57 | 변화 위치와 의미를 함께 평가 |
| BDA · xBD, overall F1 | MambaBDA-Base **81.41** | DamFormer 77.02 | 건물 위치와 피해 분류의 가중 점수 |

출처: [논문 Tables III–V](https://arxiv.org/html/2404.03425#S4.S4), [Table VII](https://arxiv.org/html/2404.03425#S4.S4), [Table IX](https://arxiv.org/html/2404.03425#S4.S4). xBD의 overall F1은 건물 위치 F1에 0.3, 피해 분류 F1에 0.7을 곱해 더한 값이다. [논문 §IV-B.2](https://arxiv.org/html/2404.03425#S4.S2)

어블레이션도 설계 의도를 뒷받침한다. SYSU-CD에서 시공간 결합을 쓰지 않은 기준 모델의 F1은 **81.11**, Sequential만 적용하면 **82.20**, Cross만 적용하면 **82.24**, Parallel만 적용하면 **82.17**, 세 방식을 함께 쓰면 **82.83**이다. 세 방식 중 하나가 압도적이라기보다, 각각의 결합이 기준 모델보다 낫고 함께 쓸 때 추가 이득이 있다는 결과다. [논문 Table XII](https://arxiv.org/html/2404.03425#S4.S5)

### 효율성 주장에는 조건이 있다

MambaBCD-Tiny는 **17.13M 파라미터·45.74 GFLOPs**, Base는 **84.70M·179.32 GFLOPs**다. 비교 대상인 BIT-18은 11.50M·106.14 GFLOPs, SwinSUNet은 39.28M·43.50 GFLOPs다. 따라서 *Mamba가 모든 비교 모델보다 작거나 연산량이 적다*고 읽으면 안 된다. Tiny는 BIT-18보다 GFLOPs가 적지만 파라미터는 많고, SwinSUNet과 비교하면 GFLOPs가 약간 더 크다. 이 수치만으로 실제 장비의 지연 시간이나 처리량을 판단할 수도 없다. [논문 Table VI](https://arxiv.org/html/2404.03425#S4.S4)

저자들은 입력 크기에 따른 GPU 메모리 사용량도 비교했다. 다만 전체 모델의 메모리 사용 추세와 실행 시간은 연산의 이론적 복잡도만으로 정해지지 않는다. 배포 환경을 평가하려면 같은 하드웨어에서 배치 크기와 입력 크기를 맞춘 지연 시간 측정이 추가로 필요하다. [논문 §IV-G](https://arxiv.org/html/2404.03425#S4.S7)

## 좋았던 점과 남는 질문

가장 설득력 있는 부분은 **변화 디코더를 별도로 설계하고 어블레이션으로 확인한 점**이다. 두 영상을 VMamba로 인코딩하는 데서 끝나지 않고, 시점 사이의 관계를 토큰 순서와 채널 결합으로 모델링했다. BCD·SCD·BDA에 같은 아이디어를 확장해 본 것도 이 접근의 범위를 보여준다. [논문 §III-E](https://arxiv.org/html/2404.03425#S3.S5), [§IV-E](https://arxiv.org/html/2404.03425#S4.S5)

결과를 일반화할 때는 세 가지를 더 확인하고 싶다.

1. **다른 지역·센서로 옮겼을 때의 성능**: 다섯 데이터셋을 평가했지만 과제별 데이터셋은 나뉘어 있다. 학습 지역 밖으로의 일반화 성능을 직접 보여주는 별도 실험으로 읽기는 어렵다. [논문 §IV-A](https://arxiv.org/html/2404.03425#S4.S1)
2. **실제 추론 비용**: 논문은 파라미터, GFLOPs, GPU 메모리 추세를 보고한다. 실시간 서비스의 판단에 필요한 지연 시간·처리량은 별도 측정이 필요하다. [논문 §IV-D, §IV-G](https://arxiv.org/html/2404.03425#S4)
3. **피해 등급의 모호성**: 저자들도 xBD의 *minor damage*가 *no damage*나 *major damage*로 혼동되기 쉽다고 설명한다. 영상에서 손상이 충분히 보이지 않거나 등급 경계가 모호하면 모델 구조만으로 해결하기 어렵다. [논문 §IV-D.3](https://arxiv.org/html/2404.03425#S4.S4)

LEVIR-CD+에서 입력에 블러·잡음·크기 변화를 가하는 실험은 흥미롭다. 예를 들어 저자들은 Gaussian blur 강도를 올렸을 때 MambaBCD의 F1 하락을 8.73%로 보고한다. 다만 이는 **인위적으로 손상한 입력에 대한 강건성** 실험이다. 실제 센서나 계절 변화 전반에 대한 검증으로 확대 해석하지 않는 편이 정확하다. [논문 §IV-H](https://arxiv.org/html/2404.03425#S4.S8)

## 정리

ChangeMamba를 읽으며 남는 핵심은 “Mamba를 영상에 썼다”보다 **두 시점의 특징을 어떤 순서로 상태 공간 모델에 전달할 것인가**다. VMamba 인코더의 전역 공간 맥락과 변화 디코더의 세 가지 시공간 결합이 함께 성능을 만든다. 논문 표는 유망한 결과를 제시하지만, 특정 현장에 적용하려면 지역 이동 성능과 실제 추론 비용을 직접 검증해야 한다.

## 참고 자료

- Chen et al., *ChangeMamba: Remote Sensing Change Detection with Spatio-Temporal State Space Model*, IEEE Transactions on Geoscience and Remote Sensing, 2024. [arXiv 원문](https://arxiv.org/html/2404.03425) · [DOI](https://doi.org/10.1109/TGRS.2024.3417253)
- [저자 공개 코드와 모델 가중치](https://github.com/ChenHongruixuan/ChangeMamba)
