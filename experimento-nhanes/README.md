# Experimento com dados públicos do NHANES (CDC)

Este experimento responde à pergunta: **um conjunto com coleta e variáveis documentadas, e proporção um pouco maior de casos de AVC, melhora a avaliação do RF + SHAP?** A resposta neste teste foi **não para desempenho preditivo**, embora a procedência dos dados seja mais verificável.

## Pesquisa e escolha da fonte

| Fonte | Procedência e disponibilidade | Equilíbrio / adequação | Decisão |
| --- | --- | --- | --- |
| [NHANES 2015–2016](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/MCQ_I.htm) + [2017–2018](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/MCQ_J.htm) | Pesquisa pública do CDC, arquivos individuais XPT, questionários e códigos publicados. | Entre pessoas de 60 anos ou mais com resposta válida, **354/4.041 (8,76%)** relataram AVC. | **Escolhida**: procedência e pergunta alvo auditáveis; mais positivos que os 5,89% da coorte adulta do CSV anterior. |
| [BRFSS do CDC](https://www.cdc.gov/brfss/annual_data/annual_2023.html) | Grande pesquisa pública com pergunta sobre diagnóstico prévio de AVC. | Amostra ampla, mas a condição também é minoritária; o volume de dados é maior. | Alternativa viável, menos simples para um teste rápido e ainda sem desfecho futuro. |
| [CSV fedesoriano do projeto inicial](../projeto-python/README.md) | Procedência questionada em [Gibson et al. (2026)](https://doi.org/10.1186/s12916-026-04981-y). | 247/4.194 adultos (5,89%). | Mantido apenas como referência histórica do trabalho. |

Não encontramos uma coorte pública de **incidência futura de AVC**, naturalmente próxima de 50/50 e com acesso imediato, que fosse adequada a uma comparação equivalente. Fazer um recorte por idade aumenta a proporção de positivos, mas altera a população estudada; não cria um dataset naturalmente balanceado.

## O que o NHANES mede

O alvo é [`MCQ160F`](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/MCQ_J.htm): resposta à pergunta se um profissional de saúde **já havia informado** à pessoa que ela teve AVC (`1=sim`, `2=não`; recusas e incertezas são excluídas). Portanto, o modelo classifica **histórico autorrelatado de AVC no momento da pesquisa**. Não prevê AVC futuro.

As entradas são idade (`RIDAGEYR`), sexo (`RIAGENDR`), IMC medido (`BMXBMI`), relato de hipertensão (`BPQ020`), doença coronariana (`MCQ160C`), diabetes (`DIQ010`) e ter fumado ao menos 100 cigarros (`SMQ020`). As definições vêm dos [arquivos demográficos](https://wwwn.cdc.gov/nchs/data/nhanes/public/2017/datafiles/DEMO_J.htm), [questionário cardiovascular](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/BPQ_J.htm), [medidas corporais](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/BMX_J.htm), [diabetes](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DIQ_J.htm) e [tabagismo](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/SMQ_J.htm) do CDC. O identificador `SEQN` é usado só para junção/auditoria. Respostas `7/9` não são convertidas em “não”. A idade é truncada em 80 anos no arquivo público.

## Implementação

[`baixar_dados.ps1`](baixar_dados.ps1) baixa diretamente do CDC os 12 arquivos XPT dos dois ciclos. [`experimento.py`](experimento.py) junta as tabelas por `SEQN` e preserva entrevistados sem exame de IMC, deixando esse valor ausente para imputação no treino. Define a coorte com **idade ≥60** e resposta `1` ou `2` ao alvo.

O `train_test_split` é estratificado, 80/20, `random_state=42`: **3.232 no treino (283 positivos)** e **809 no teste (71 positivos)**. O teste contém somente pessoas originais. Comparamos RF de 200 árvores **sem reamostragem** e com **SMOTENC somente no treino**. Imputação, SMOTENC e codificação ficam no `imblearn.Pipeline`; as cinco variáveis categóricas são tratadas como nominais. No treino balanceado, o SMOTENC leva as 283 observações positivas ao número de negativas, 2.949 por classe. Não houve busca de hiperparâmetros nem ajuste de limiar pelo teste.

O `shap.TreeExplainer` explica o RF com SMOTENC em **150 registros originais do teste**, seleciona explicitamente `stroke=1` e verifica `valor-base + SHAP = predict_proba` (erro máximo `1,22×10⁻¹⁴`). Foram gerados um [summary plot global](figuras/shap_global.png) e uma [explicação local](figuras/shap_local.png) de verdadeiro positivo. A importância agrupada soma as categorias da mesma variável por pessoa antes de calcular a magnitude média.

## Resultados no teste separado

| Modelo | Acurácia | Precisão AVC | Recall AVC | F1 AVC | AUC AVC | VP / 71 | FP |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| RF sem SMOTENC | 0,891 | 0,160 | 0,056 | 0,083 | 0,559 | 4 | 21 |
| RF com SMOTENC no treino | **0,807** | **0,137** | **0,225** | **0,170** | **0,600** | **16** | **101** |

Prever sempre “sem AVC” daria acurácia **738/809 = 0,912**, sem detectar nenhum caso positivo. O SMOTENC aumentou os verdadeiros positivos de 4 para 16, à custa de 80 falsos positivos adicionais. O F1 melhorou, mas a AUC de 0,600 é fraca. Não há evidência de que este modelo seja útil para decisão clínica. As contagens, ausências, hashes SHA-256 dos arquivos de origem e métricas completas estão em [`resultados/metricas.json`](resultados/metricas.json).

No SHAP agrupado, as maiores contribuições médias foram **idade (0,154), IMC (0,106) e hipertensão (0,079)**. A hipertensão tem mais destaque que no CSV inicial, o que mostra que o ranking depende da população, das variáveis e do modelo. **Isso não prova relação causal nem resgata o baixo desempenho.** O caso local teve saída `1,00` do RF, mas o modelo não foi calibrado e o treino foi reamostrado; esse número não significa risco futuro de 100%.

## Limites que mudam a interpretação

- Os fatores e o AVC foram coletados na mesma pesquisa; alguns fatores podem ter sido medidos **após** o evento. Não há ordem temporal suficiente para predição de risco futuro nem inferência causal.
- O alvo é um diagnóstico **relatado pelo participante**, não uma confirmação clínica individual verificada neste experimento.
- O NHANES tem desenho amostral complexo. Este teste calcula métricas **sem pesos amostrais** e não estima prevalência ou desempenho da população dos EUA. O [CDC orienta pesos e desenho ao combinar ciclos](https://wwwn.cdc.gov/nchs/nhanes/tutorials/weighting.aspx).
- O recorte ≥60 anos foi escolhido para aumentar a fração positiva; os resultados não se aplicam automaticamente a adultos mais jovens. A AUC e demais métricas não podem ser comparadas diretamente às do CSV anterior como se fossem o mesmo problema.

## Reproduzir no Windows

Na raiz do repositório, com PowerShell e Python 3:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\projeto-python\requirements.txt
.\experimento-nhanes\baixar_dados.ps1
.\.venv\Scripts\python.exe .\experimento-nhanes\experimento.py
```

Os XPT são baixados para `experimento-nhanes/dados/` e ignorados pelo Git; o JSON registra o hash de cada arquivo usado. O código e os resultados podem ser inspecionados sem baixar os dados novamente.
