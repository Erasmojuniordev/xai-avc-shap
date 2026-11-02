# Random Forest para AVC com explicações SHAP

Projeto da disciplina de Fundamentos da Inteligência Artificial. Reimplementamos em Python o Random Forest estudado por [Dritsas e Trigka (2022)](https://doi.org/10.3390/s22134670) e acrescentamos explicações globais e individuais com `shap.TreeExplainer`. O resultado é uma **análise didática do CSV fornecido**, não um modelo validado para prever AVC futuro ou orientar pacientes.

**Pergunta do projeto:** quais entradas influenciam as previsões do RF para `stroke=1`, e até onde essas explicações podem ser interpretadas diante das limitações do artigo e do dataset?

## Estrutura do repositório

| Caminho | Função |
| --- | --- |
| [`Artigo Base.pdf`](Artigo%20Base.pdf) | Fonte do método e dos resultados publicados. |
| [`healthcare-dataset-stroke-data.csv`](healthcare-dataset-stroke-data.csv) | Cópia do *Stroke Prediction Dataset* de fedesoriano usada em todas as execuções. |
| [`notebooks/01_auditoria_dados.ipynb`](notebooks/01_auditoria_dados.ipynb) | Contagens, ausências, categorias e confronto da amostra com o artigo. |
| [`notebooks/02_modelo_e_shap.ipynb`](notebooks/02_modelo_e_shap.ipynb) | Fluxo principal executado: RF, avaliação, SHAP global e dois casos locais. |
| [`stroke_xai.py`](stroke_xai.py) | Funções reutilizadas pelo notebook: coorte, split, pipeline, métricas e tratamento do SHAP. |
| [`experiments/compare_cv_protocols.py`](experiments/compare_cv_protocols.py) | Experimento secundário sobre a ordem do SMOTENC e da validação cruzada. |
| [`results/`](results/) e [`figures/`](figures/) | Métricas e figuras exportadas dos experimentos. |
| [`apresentacao/Apresentacao_Critica_AVC_SHAP.pptx`](apresentacao/Apresentacao_Critica_AVC_SHAP.pptx) | Apresentação final da disciplina, com notas de fala incorporadas. |
| [`requirements.txt`](requirements.txt) e [`requirements-lock.txt`](requirements-lock.txt) | Dependências diretas e versões transitivas da execução original. |

O [repositório de Alberto Eusebio](https://github.com/AlbertoEusebio/Brain-Stroke-Prediction) foi apenas referência auxiliar para a ideia de usar SMOTENC em dados mistos. Ele **não é o código dos autores do artigo**. O código deste repositório foi escrito para a extensão proposta.

## Desenvolvimento e decisões

1. **Auditoria.** O artigo informa 3.254 participantes com mais de 18 anos. O filtro declarado, aplicado ao CSV disponível, retorna **4.194 registros**, dos quais **247 têm `stroke=1` (5,89%)**. Há **180 valores ausentes de IMC** entre esses adultos, embora o artigo afirme não haver ausências no subconjunto usado. Mantivemos `smoking_status="Unknown"` e o único `gender="Other"`; não inventamos exclusões para obter 3.254 linhas.
2. **Treino.** `train_test_split` estratificado (80/20, `random_state=42`) ocorre **antes** de qualquer imputação ou reamostragem. O treino tem 3.355 registros e 198 positivos; o teste tem 839 registros originais do CSV e 49 positivos. `id` fica fora das entradas. O `imblearn.Pipeline` aprende a imputação no treino, aplica **SMOTENC somente no treino**, codifica categorias e ajusta um `RandomForestClassifier` com 200 árvores. O SMOTENC gera 2.959 positivos sintéticos e deixa o treino com 3.157 registros por classe. O teste não é balanceado.
3. **Avaliação.** O teste preserva a distribuição do CSV. Calculamos matriz de confusão, precisão, recall, F1 e AUC-ROC para `stroke=1`, além de acurácia. Não ajustamos limiar ou hiperparâmetros com o teste.
4. **Explicabilidade.** `TreeExplainer` explica o mesmo RF treinado, usando 200 registros originais do teste. O notebook inspeciona o formato retornado pelo SHAP, seleciona explicitamente a classe `1` e confere que valor-base + contribuições reproduz `predict_proba` (erro máximo inferior a `1e-6`). A amostra é fixa pela semente 42.
5. **Comparação metodológica.** Executamos dez dobras com SMOTENC dentro do treino de cada dobra e, separadamente, balanceamento da coorte inteira antes das dobras. O segundo protocolo é deliberadamente exploratório: sua validação inclui dados sintéticos e pode sofrer vazamento. Ele não substitui o teste principal.

### Resultado principal no teste separado

| Métrica | RF deste projeto | RF no artigo, Tabela 2 |
| --- | ---: | ---: |
| Acurácia | **0,874** | 0,970 |
| Precisão | **0,120** | 0,966 |
| Recall | **0,184** | 0,966 |
| F1 | **0,145** | 0,966 |
| AUC-ROC | **0,755** | 0,986 |

Na nossa matriz de confusão: **724 verdadeiros negativos, 66 falsos positivos, 40 falsos negativos e 9 verdadeiros positivos**. O RF identificou apenas 9 dos 49 positivos do teste. A acurácia de 87,37% deve ser lida com o desbalanceamento em mente: prever sempre `stroke=0` acertaria 790/839 registros (94,16%), sem detectar nenhum positivo. Os números completos estão em [`results/metrics.json`](results/metrics.json).

Os `0,966` da Tabela 2 do artigo são apresentados como **médias**, enquanto nossa precisão, recall e F1 se referem à classe positiva em teste separado. O artigo utilizou WEKA e dez dobras no conjunto balanceado; não fornece código, configuração suficiente do RF nem regra de seleção que reproduza seus 3.254 participantes no CSV atual. A Tabela 3 também apresenta valores diferentes dos da Tabela 2. Portanto, fizemos uma **reimplementação metodológica**, não uma réplica numérica exata. Essas inconsistências influenciaram a escolha de um teste separado antes do SMOTENC e a forma cautelosa de comparar os resultados. O artigo foi publicado antes da crítica de procedência de 2026; não inferimos intenção dos autores.

### Experimento secundário: ordem do SMOTENC

| Protocolo de dez dobras | Acurácia média | Recall médio | AUC-ROC média |
| --- | ---: | ---: | ---: |
| SMOTENC no treino de cada dobra; validação em registros originais | 0,878 | 0,182 | 0,738 |
| SMOTENC antes das dobras; validação mista | 0,932 | 0,951 | 0,981 |

No protocolo seguro, o RF identificou **45 dos 247 positivos originais** ao longo das dez dobras. No protocolo pré-balanceado, acertou **139 dos 247 positivos originais** e **3.613 dos 3.700 sintéticos**. Mesmo os 139 acertos em registros originais podem estar contaminados por vazamento, pois amostras sintéticas aparentadas podem cair no treino de outra dobra. A AUC de 0,981 se aproxima da publicada, mas isso **não demonstra desempenho clínico** nem prova que o protocolo explique sozinho toda a divergência. Cada dobra e cada matriz estão em [`results/comparacao_cv.json`](results/comparacao_cv.json).

## O que o SHAP acrescentou

A extensão trouxe **transparência sobre a saída do RF**, não ganho demonstrado de precisão preditiva. O [summary plot](figures/shap_summary_stroke1.png) mostra a magnitude e a direção das contribuições das 22 colunas recebidas pelo modelo. O [gráfico de importância agregada](figures/shap_importancia_agrupada.png) soma as contribuições das categorias de cada variável **por registro** e depois calcula a média do valor absoluto. A ordem principal foi idade (`0,176`), glicose média (`0,082`) e tipo de trabalho (`0,076`); hipertensão (`0,016`) e doença cardíaca (`0,005`) ficaram abaixo nesse RF. Os valores exatos estão em [`results/importancia_shap.csv`](results/importancia_shap.csv).

Também produzimos duas explicações individuais por *waterfall*:

| Caso do teste | Rótulo / previsão | Saída do RF para `stroke=1` | Figura |
| --- | --- | ---: | --- |
| ID `40899`, verdadeiro positivo | `1` / `1` | `0,98` | [Waterfall](figures/shap_waterfall_verdadeiro_positivo.png) |
| ID `54385`, falso negativo | `1` / `0` | `0,03` | [Waterfall](figures/shap_waterfall_falso_negativo.png) |

Nos dois casos, o notebook valida a aditividade das contribuições. Assim, **a aplicação de SHAP foi verificada matematicamente e é coerente com as previsões do RF neste CSV**. SHAP não valida a qualidade dos dados nem identifica causas médicas. As saídas do RF treinado com SMOTENC não foram calibradas para a prevalência observada; `0,98` não significa “98% de risco futuro de AVC”.

O [CDC](https://www.cdc.gov/stroke/risk-factors/) reconhece idade, pressão alta, doença cardíaca, diabetes e tabagismo como fatores associados ao AVC. No CSV adulto, `stroke=1` é mais frequente com hipertensão (13,3% contra 4,9%) e doença cardíaca (17,1% contra 5,1%). A importância SHAP menor desses indicadores **não nega a associação clínica**: idade e outras entradas podem compartilhar informação com eles; os dados, o modelo e a codificação também influenciam a atribuição. Não determinamos uma causa única para a posição no ranking. Tipo de trabalho e estado civil não devem ser interpretados como causas a partir desse gráfico.

## Limite fundamental: procedência do dataset

[Gibson et al. (2026)](https://doi.org/10.1186/s12916-026-04981-y) analisaram especificamente o conjunto Kaggle de AVC com 5.110 linhas e encontraram **0 de 9 itens de procedência documentados** na avaliação realizada, além de padrões anômalos de identificador, glicose e idade. A autenticidade não pôde ser verificada; o estudo **não demonstrou** que todos os registros foram fabricados. Nosso `stroke` representa um histórico informado no CSV, sem acompanhamento temporal demonstrado. Por isso, as métricas e as explicações descrevem **este arquivo e este modelo**. O confronto com literatura clínica é uma checagem de plausibilidade, não uma validação externa.

## Como reproduzir

Ambiente usado: Windows, Python 3.14.2, CPU, `random_state=42`. Na raiz do projeto:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m jupyter nbconvert --execute --to notebook --inplace notebooks/01_auditoria_dados.ipynb
.\.venv\Scripts\python.exe -m jupyter nbconvert --execute --to notebook --inplace notebooks/02_modelo_e_shap.ipynb
.\.venv\Scripts\python.exe experiments/compare_cv_protocols.py
```

Também é possível abrir os notebooks pelo Jupyter. Execute a auditoria antes do modelo. A execução do segundo notebook atualiza os arquivos em `results/` e `figures/`; o script do experimento secundário atualiza `results/comparacao_cv.json`. O `requirements-lock.txt` registra o ambiente completo instalado na execução original.

## Referências

- Dritsas, E.; Trigka, M. (2022). [*Stroke Risk Prediction with Machine Learning Techniques*](https://doi.org/10.3390/s22134670). Fonte do método e dos resultados publicados.
- Gibson, A. D. et al. (2026). [*Evidence of unreliable data and poor data provenance in clinical prediction model research and clinical practice*](https://doi.org/10.1186/s12916-026-04981-y). Crítica à procedência deste dataset.
- fedesoriano. [*Stroke Prediction Dataset*](https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset). Origem pública do arquivo fornecido.
- [Documentação de `shap.TreeExplainer`](https://shap.readthedocs.io/en/latest/generated/shap.TreeExplainer.html). Formato multissaída e aditividade.
- [Documentação do `SMOTENC`](https://imbalanced-learn.org/stable/references/generated/imblearn.over_sampling.SMOTENC.html). Reamostragem para atributos numéricos e categóricos.
- CDC. [*Risk Factors for Stroke*](https://www.cdc.gov/stroke/risk-factors/). Referência para o confronto clínico.
