# Discussão dos resultados e confronto com a literatura clínica

**Execução:** Python 3.14.2, `random_state=42`, CSV incluído no repositório (SHA-256 `644d473b05d2797006bd94865e4f8bb057f0c721617911613c82c8fc707420`). Os números abaixo vêm de `notebooks/02_modelo_e_shap.ipynb`, `results/metrics.json` e `results/importancia_shap.csv`. São resultados de um experimento acadêmico, não de validação clínica.

## Baseline e comparabilidade

O filtro `age > 18` produziu 4.194 registros, dos quais 247 têm `stroke=1`. O split estratificado separou 3.355 registros para treino (198 positivos) e 839 para teste (49 positivos). A mediana de `bmi`, a codificação e o SMOTENC foram ajustados somente no treino. O teste não foi reamostrado.

| Métrica no teste | Valor |
| --- | ---: |
| Acurácia | 0,874 |
| Precisão (`stroke=1`) | 0,120 |
| Recall (`stroke=1`) | 0,184 |
| F1 (`stroke=1`) | 0,145 |
| AUC-ROC (probabilidade de `stroke=1`) | 0,755 |

Matriz de confusão: 724 verdadeiros negativos, 66 falsos positivos, 40 falsos negativos e 9 verdadeiros positivos. A acurácia, isoladamente, esconderia os 40 positivos não identificados. A Tabela 2 de [Dritsas e Trigka (2022)](https://doi.org/10.3390/s22134670) apresenta RF com precisão, recall e F-measure médios de 0,966, AUC de 0,986 e acurácia de 0,97, em WEKA e validação cruzada sobre o conjunto balanceado. Não são resultados diretamente comparáveis: a coorte publicada tem 3.254 pessoas, não 4.194, e o protocolo publicado sugere SMOTE antes da validação cruzada. Isso **pode** inflar as métricas por vazamento entre dobras, mas o artigo não fornece código para demonstrar cada passo. O RF de scikit-learn também não é uma cópia paramétrica comprovada do RF de WEKA.

## SHAP global

O `TreeExplainer` explicou 200 pessoas reais do teste, amostradas com `random_state=42`. A classe `stroke=1` foi selecionada explicitamente da saída `(200, 22, 2)` do SHAP 0.54.1. A soma das contribuições e do valor-base coincidiu com `predict_proba` até erro numérico. A importância abaixo soma os SHAP das categorias de uma variável **em cada pessoa** e depois calcula a média do valor absoluto:

| Variável original | Média de `|SHAP|` | Leitura clínica |
| --- | ---: | --- |
| Idade | 0,176 | É a variável dominante. Idades mais altas tendem a aumentar a saída do modelo no beeswarm, em linha com o aumento de risco de AVC com a idade descrito pelo [CDC](https://www.cdc.gov/stroke/risk-factors/). |
| Glicose média | 0,082 | A variável influencia o modelo, mas o gráfico não mostra uma relação monotônica simples. Glicose medida **não equivale** a diagnóstico de diabetes. O [CDC](https://www.cdc.gov/stroke/risk-factors/) reconhece diabetes como fator de risco, sem validar esta variável isolada como substituto clínico. |
| Tipo de trabalho | 0,076 | Terceira em importância para o modelo; o dado não sustenta tratá-la como fator causal de AVC. Pode refletir composição etária ou outros fatores não medidos. É um alerta para interpretação de variáveis sociais. |
| Tabagismo | 0,044 | O [CDC](https://www.cdc.gov/stroke/risk-factors/) relaciona tabaco ao risco de AVC. A categoria `Unknown` é frequente (835 adultos) e tem contribuição própria; não interpretar `Unknown` como comportamento de fumar. |
| IMC | 0,043 | Peso/obesidade são associados ao AVC pelo [CDC](https://www.cdc.gov/stroke/prevention/). O padrão SHAP do IMC é heterogêneo; não inferir um efeito clínico linear ou causal a partir dele. |
| Já casou | 0,042 | Possível marcador social e de idade; não é evidência de causalidade. |
| Residência | 0,027 | Associação do modelo com o conjunto fornecido; não equivale a fator clínico individual. |
| Gênero | 0,020 | O dataset tem apenas um adulto `Other`; interpretações para essa categoria não são estáveis. |
| Hipertensão | 0,016 | Baixa importância **neste RF**, apesar de o [CDC](https://www.cdc.gov/stroke/risk-factors/) apontar pressão alta como causa importante de AVC. A divergência pode refletir correlações, qualidade dos dados, baixa frequência ou escolhas do modelo; o SHAP não decide entre essas hipóteses. |
| Doença cardíaca | 0,005 | A baixa importância do indicador genérico no RF não contradiz a associação clínica de doenças cardíacas com AVC descrita pelo [CDC](https://www.cdc.gov/stroke/risk-factors/). |

As unidades de SHAP nesta execução são pontos da saída de probabilidade do **modelo**, não efeitos causais. O valor-base da classe positiva é aproximadamente 0,500 porque a distribuição de treino foi reamostrada. As probabilidades não foram calibradas para a prevalência real de cerca de 5,9%; por isso, uma saída de 0,98 **não deve** ser lida como “98% de risco clínico de AVC”.

## Dois exemplos locais

- Verdadeiro positivo, registro `40899`: `stroke=1`, previsão `1`, saída do RF `0,98`. Idade de 78 anos e tabagismo “ex-fumante” aparecem entre as maiores contribuições positivas neste caso. O waterfall é uma decomposição da previsão, não uma explicação médica do evento.
- Falso negativo, registro `54385`: `stroke=1`, previsão `0`, saída do RF `0,03`. Idade de 45 anos e glicose média de 64,14 mg/dL reduziram fortemente a saída do modelo em relação ao valor-base. Este erro ilustra o limite do classificador para pessoas positivas que não seguem os padrões predominantes do treino.

Os gráficos estão em `figures/`. O rótulo `stroke` no CSV informa ocorrência prévia, sem acompanhamento temporal e sem evidência de validação externa. Assim, o trabalho explica a classificação retrospectiva deste conjunto, não um sistema seguro para prever eventos futuros ou orientar cuidado individual.

## Fontes

1. Dritsas, E.; Trigka, M. (2022). [*Stroke Risk Prediction with Machine Learning Techniques*](https://doi.org/10.3390/s22134670). *Sensors*, 22(13), 4670. Fonte do método publicado e da comparação de métricas.
2. Centers for Disease Control and Prevention (CDC). [*Risk Factors for Stroke*](https://www.cdc.gov/stroke/risk-factors/). Fonte clínica para idade, pressão alta, doença cardíaca, diabetes, obesidade e tabagismo.
3. CDC. [*Preventing Stroke*](https://www.cdc.gov/stroke/prevention/). Fonte clínica sobre peso/IMC e prevenção.
4. SHAP. [*TreeExplainer documentation*](https://shap.readthedocs.io/en/latest/generated/shap.TreeExplainer.html). Formato multissaída, valor-base e soma das contribuições.
