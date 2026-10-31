# Plano e acompanhamento — explicabilidade da predição de AVC com SHAP

**Estado em 30/10/2026:** baseline, SHAP, discussão clínica, revisão final e visualização local concluídos.  
**Escopo:** um Random Forest em Python/scikit-learn, avaliado em dados de teste não balanceados e explicado com `shap.TreeExplainer`.

## 1. Pergunta e entregas

**Pergunta:** quais variáveis mais influenciam as previsões do Random Forest para a classe `stroke=1`, no conjunto fornecido, e como essas contribuições se relacionam com fatores de risco clínicos conhecidos?

Entregas previstas:

1. Notebook Jupyter reproduzível com auditoria da base, pré-processamento, Random Forest, métricas e explicações SHAP.
2. Tabela de precisão, recall, F1, AUC-ROC e acurácia no teste original, com matriz de confusão e comparação contextualizada com o artigo.
3. Gráfico SHAP global (beeswarm/summary e, se necessário para legibilidade, barras de média de `|SHAP|`) para a classe positiva.
4. Um ou dois waterfall plots de pessoas **reais do teste**, preferindo um verdadeiro positivo; se não houver, documentar o critério alternativo.
5. Discussão clínica com fontes verificáveis, divergências e limites de interpretação. Comparação com `feature_importances_` apenas se houver tempo.

Fora do escopo original: stacking, SVM ou qualquer outro modelo, `KernelExplainer`, redes neurais e otimização extensa de hiperparâmetros. A pedido posterior do usuário, foi acrescentada uma **página web estática opcional** para apresentar os resultados já calculados, sem inferência interativa.

## 2. Hierarquia das fontes e achados já conferidos

O método publicado tem como fonte **Dritsas e Trigka (2022)**, *Sensors* 22(13), 4670, DOI [10.3390/s22134670](https://doi.org/10.3390/s22134670). A apresentação local define a proposta didática de extensão. O [repositório de Alberto Eusebio](https://github.com/AlbertoEusebio/Brain-Stroke-Prediction) é somente referência auxiliar de organização e código; **não é código publicado pelos autores do artigo nem réplica fiel**. O README do repositório reconhece vazamento no notebook de “paper replica” e aponta o notebook “best practice” como correção do uso de SMOTE.

| Item | Artigo | Arquivo local / consequência |
| --- | --- | --- |
| Amostra adulta | 3.254 pessoas com idade >18; 10 entradas + `stroke`; 5,53% positivos | O CSV tem 5.110 linhas e 12 colunas, incluindo `id`. `age > 18` produz **4.194** linhas: 247 positivas e 3.947 negativas (5,89% positivas). A amostra do artigo não é recuperada pelo filtro etário declarado. |
| Ausências | Afirma não haver valores faltantes no subconjunto | `bmi` contém a string `N/A`, reconhecida como ausente pelo pandas: **201** casos no CSV e **180** entre adultos. Contar somente células vazias ocultaria o problema. |
| Categorias | Tabagismo descrito em três categorias; gênero em duas | Entre adultos, `smoking_status='Unknown'` ocorre **835** vezes e `gender='Other'` uma vez. Não eliminar essas observações sem justificativa. |
| Filtros exploratórios | Critério adicional não explicitado | Adultos com tabagismo conhecido: 3.359 linhas. Se também forem exigidos `bmi` completo: 3.224 linhas, 180 positivas. **Nenhum desses recortes é 3.254**; não forçar esse número. |
| Balanceamento/avaliação | SMOTE até 6.148 instâncias, seguido de validação cruzada em 10 dobras no conjunto balanceado (seção 4.1) | O texto sugere que o balanceamento precedeu a validação. Isso cria risco de vazamento entre dobras; a ordem exata de todas as operações não está integralmente especificada. O experimento novo usará teste separado antes de qualquer reamostragem. |
| RF publicado | Tabela 2: precisão, recall e F-measure **médios** = 0,966; AUC = 0,986; acurácia = 0,97 | A tabela é rotulada “Average performance”; figuras e discussão tratam a classe `stroke` em separado. Comparar os números como referência publicada, sem afirmar que 0,966 é exatamente cada métrica da classe positiva. A Tabela 3 ainda apresenta valores de RF diferentes; registrar a inconsistência se usada na discussão. |

O artigo não fornece código nem configuração suficiente do Random Forest e da preparação dos atributos para uma reprodução numérica exata em scikit-learn. O trabalho será uma **reimplementação metodológica com extensão XAI**, com diferenças documentadas. A apresentação não substitui o artigo como evidência do método.

## 3. Decisões metodológicas para implementar

1. **Unidade e alvo.** Cada linha é um registro. `stroke` é binário; usar `1` como classe positiva. Excluir `id` das entradas. Manter as dez variáveis do artigo: `gender`, `age`, `hypertension`, `heart_disease`, `ever_married`, `work_type`, `Residence_type`, `avg_glucose_level`, `bmi`, `smoking_status`. Verificar tipos, faixa de valores, duplicatas e proporções antes de ajustar qualquer modelo.
2. **Coorte principal.** Aplicar `age > 18` conforme o texto do artigo. Usar os 4.194 registros observados como coorte principal, salvo se uma regra adicional documentada no artigo for comprovada. Registrar a divergência de 940 registros em relação ao número publicado. `Unknown` será inicialmente uma categoria observada de tabagismo; `Other` será mantida, com atenção à raridade. Não atribuir significado clínico a essas categorias por si sós.
3. **Separação.** Usar `train_test_split(..., stratify=y, random_state=42, test_size=0.20)` uma única vez. Salvar contagens e índices/IDs de treino e teste para rastreabilidade. Não inspecionar rótulos do teste para escolher transformações, hiperparâmetros ou limiar.
4. **Pré-processamento.** Ajustar imputação de `bmi` (mediana) **somente no treino**; aplicar aos dados de teste com o mesmo transformador. Codificar categorias com tratamento explícito de categorias desconhecidas no teste. Preservar nomes das variáveis transformadas para SHAP. Registrar a estratégia exata e as versões das bibliotecas no notebook.
5. **Balanceamento misto.** Preferir `imblearn.over_sampling.SMOTENC` no treino, com colunas categóricas identificadas, seguido de codificação adequada para o RF. É a variante de SMOTE apropriada para entradas numéricas e categóricas, evitando interpolar códigos ou colunas one-hot como se fossem medidas contínuas. Se uma limitação concreta impedir essa sequência, documentar a alternativa e o efeito nas observações sintéticas; não aplicar SMOTE ao teste. Encapsular imputação, codificação, reamostragem e RF num `imblearn.pipeline.Pipeline` quando houver validação cruzada. Verificar que todas as etapas que aprendem com dados sejam ajustadas somente nas dobras de treino.
6. **Modelo.** Treinar apenas `RandomForestClassifier` com `random_state=42`, `n_jobs=-1` e parâmetros iniciais explícitos (por exemplo, `n_estimators=200`; demais padrões registrados). Evitar busca extensa ou seleção guiada pelo teste. Como WEKA e scikit-learn diferem, não prometer parâmetros equivalentes.
7. **Avaliação.** Calcular `predict_proba` para `stroke=1`, matriz de confusão, precisão, recall, F1, AUC-ROC e acurácia no teste **com prevalência original**; reportar suporte por classe. Limiar padrão de 0,5, salvo decisão prévia justificada no treino. Se houver validação cruzada adicional, usar `StratifiedKFold` e `imblearn.Pipeline`, sempre sem reamostragem da dobra de validação. Comparar com o artigo em tabela com colunas separadas para população, protocolo e métricas, evitando comparação direta como se fossem experimentos idênticos.
8. **SHAP.** Explicar o RF ajustado, sem refazê-lo. Usar observações reais do teste no espaço de atributos que o RF recebe. Inspecionar `rf.classes_`, versão do SHAP, `shap_values.shape` e `expected_value`. Selecionar explicitamente o índice de `stroke=1`: versões recentes tendem a retornar `(amostras, atributos, 2)`; versões anteriores podem retornar lista por classe. Falhar de forma explícita se o formato for inesperado. Documentar a unidade da saída (probabilidade do RF, após confirmação por soma aditiva contra `predict_proba`) e a população de referência do explainer. Para gráficos com colunas codificadas, mostrar rótulos compreensíveis e, na importância global, agregar dummies da mesma variável original quando necessário, explicando o método de agregação.
9. **Amostragem para explicações.** Calcular SHAP em subconjunto reprodutível de pacientes reais do teste se o custo de CPU exigir; informar tamanho e seleção. O gráfico global deve conter valores e direção do efeito da classe positiva. Para casos locais, mostrar valor-base, contribuições, probabilidade final, rótulo real e rótulo previsto. Verificar numericamente `base_value + soma(SHAP) ≈ predict_proba(stroke=1)` para os exemplos.
10. **Leitura clínica.** Confrontar **somente depois dos resultados** as variáveis de maior impacto com as fontes da seção 6. Distinguir importância para o modelo de associação clínica, causalidade e utilidade diagnóstica. Interpretar `avg_glucose_level` como glicose observada, não como diagnóstico confirmado de diabetes; `heart_disease` é indicador amplo; `bmi` é indicador imperfeito de adiposidade. Relatar resultados que contrariem a literatura, inclusive impacto baixo de hipertensão. A base tem `stroke` como histórico informado de AVC, sem acompanhamento temporal demonstrado; não apresentar a previsão como risco prospectivo individual validado.

## 4. Etapas e andamento

| Etapa | Estado | Trabalho | Critério para avançar |
| --- | --- | --- | --- |
| 0. Fontes e auditoria preliminar | **Concluída** | Ler artigo, apresentação, README auxiliar e CSV; localizar divergências de amostra e ausências. | Achados da seção 2 registrados. |
| 1. Ambiente e auditoria reproduzível | **Concluída** | Ambiente virtual Python 3.14.2, dependências fixadas, notebook com contagens, tipos, `N/A`, categorias e coorte. | `notebooks/01_auditoria_dados.ipynb` executado integralmente; asserções e números da seção 2 conferidos. |
| 2. Baseline RF | **Concluída** | Split estratificado, imputação e SMOTENC no treino, codificação, RF e métricas no teste original. | 3.355 treino / 839 teste; teste com 49 positivos; `results/metrics.json` e matriz de confusão reproduzidos. |
| 3. SHAP global e local | **Concluída** | Classe positiva selecionada explicitamente; beeswarm, importância agregada e dois waterfalls reais. | Saída `(200, 22, 2)` tratada; aditividade validada; gráficos em `figures/` inspecionados. |
| 4. Validação clínica e comparação | **Concluída** | Confronto com CDC e discussão das divergências com o artigo. | `DISCUSSAO_CLINICA.md` cita fontes e explicita limites de causalidade e calibração. |
| 5. Revisão final | **Concluída** | Revisados arquivos, execução completa, figuras e apresentação local. | Notebook de modelo executado sem erros; notebooks validados; matriz de confusão conferida; figuras inspecionadas; painel e imagens responderam HTTP 200. |

**Registro de andamento:** acrescentar a cada sessão uma linha no formato `AAAA-MM-DD | etapa | decisão/alteração | evidência (célula, figura ou arquivo) | pendência`. Não marcar uma etapa como concluída apenas porque o código foi escrito: exigir o critério da última coluna.

| Data | Etapa | Decisão/alteração | Evidência | Pendência |
| --- | --- | --- | --- | --- |
| 2026-10-30 | 1 | Criado ambiente Python 3.14.2 e fixadas dependências diretas/transitivas; criada auditoria reproduzível sem filtrar `Unknown` ou `Other`. Estrutura do repositório auxiliar usada apenas como referência conceitual, sem copiar código. | `requirements.txt`, `requirements-lock.txt`, `notebooks/01_auditoria_dados.ipynb` executado (4 células de código, sem erro; SHA-256 `644d473b05d2797006bd94865e4f8bb057f0c721617911613c82c8fcfc707420`). Commit `844a301` publicado no [repositório privado](https://github.com/Erasmojuniordev/xai-avc-shap). | Etapa 2: split, pré-processamento, SMOTENC, Random Forest e avaliação. |
| 2026-10-30 | 2–4 | Reaproveitada a ideia de SMOTENC após o split do notebook auxiliar; implementação própria com split estratificado, pipeline sem vazamento, RF e SHAP. Documentadas métricas e leitura clínica. | `stroke_xai.py`, `notebooks/02_modelo_e_shap.ipynb`, `results/`, `figures/`, `DISCUSSAO_CLINICA.md`; execução integral sem erro. Commit `d093055` publicado no repositório privado. | Nenhuma para essas etapas. |
| 2026-10-30 | Complemento opcional e revisão | Criado painel estático local, apenas para leitura dos resultados; revisados links e execução. | `site/index.html`, `site/style.css`, `site/preview.png`; respostas HTTP 200, captura visual e validações dos notebooks e resultados. | Nenhuma; manter a página sincronizada se uma execução futura alterar os números. |

## 5. Riscos e respostas planejadas

| Risco | Resposta |
| --- | --- |
| Coorte do artigo não reproduzível a partir do CSV fornecido | Expor contagens e regras em vez de ajustar registros para chegar a 3.254; limitar a conclusão de replicação. |
| Vazamento por imputação, codificação ou SMOTE | Ajustar transformadores no treino; usar `imblearn.Pipeline` em qualquer validação cruzada; teste intocado. |
| Poucos AVCs reais no teste | Reportar suporte e matriz de confusão; evitar interpretar acurácia isoladamente e evitar promessa de F1 próximo ao artigo. |
| Mistura de variáveis categóricas com SMOTE comum | Preferir SMOTENC e conferir categorias após reamostragem. |
| SHAP muda de formato entre versões | Verificação de dimensões, classe positiva e aditividade antes de plotar. |
| Dummies fragmentam a interpretação de variáveis originais | Distinguir contribuição de categoria específica da importância agregada da variável; explicitar agregação. |
| Validação clínica confundida com validação externa | Chamar de confronto com literatura; o dataset público não comprova aplicação clínica segura. |

## 6. Referências para implementação e discussão

- Dritsas, E.; Trigka, M. (2022). [*Stroke Risk Prediction with Machine Learning Techniques*](https://doi.org/10.3390/s22134670). *Sensors*, 22(13), 4670. Fonte única para caracterizar o método e os resultados do artigo.
- Kaggle, fedesoriano. [*Stroke Prediction Dataset*](https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset). Proveniência declarada da base; os números deste plano foram contados diretamente no CSV fornecido.
- Alberto Eusebio et al. [*Brain-Stroke-Prediction* — README](https://github.com/AlbertoEusebio/Brain-Stroke-Prediction/blob/main/README.md). Referência auxiliar de estrutura; não citar como código dos autores do artigo.
- [Documentação do `shap.TreeExplainer`](https://shap.readthedocs.io/en/latest/generated/shap.TreeExplainer.html). Formato multissaída, valor-base e aditividade; consultar a documentação correspondente à versão instalada durante a implementação.
- CDC. [*Risk Factors for Stroke*](https://www.cdc.gov/stroke/risk-factors/). Fonte clínica para idade, hipertensão, doença cardíaca, diabetes, obesidade e tabagismo. Verificar as relações específicas usadas na discussão final.
- CDC. [*Preventing Stroke*](https://www.cdc.gov/stroke/prevention/). Apoio para interpretação de peso/IMC e prevenção, sem transformar SHAP em recomendação clínica individual.

## 7. Condição de encerramento do projeto

O projeto estará concluído quando as cinco entregas da seção 1 estiverem no notebook/relatório, os números forem rastreáveis à execução final, o vazamento tiver sido evitado e as diferenças em relação ao artigo estiverem descritas. Um desempenho inferior ao publicado, isoladamente, não reprova a extensão: a avaliação principal é a validade do protocolo e a interpretação correta das explicações.
