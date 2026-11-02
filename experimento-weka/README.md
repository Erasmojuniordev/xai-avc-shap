# Experimento WEKA: reprodução aproximada do artigo

Este experimento pergunta se a combinação **WEKA 3.8.6 + SMOTE antes da validação cruzada + classificador configurado como no artigo** produz resultados próximos aos publicados por [Dritsas e Trigka (2022)](https://doi.org/10.3390/s22134670) usando o [CSV disponível](../projeto-python/healthcare-dataset-stroke-data.csv). É uma investigação didática de reprodutibilidade, separada do [projeto Random Forest + SHAP](../projeto-python/README.md).

## Escolha do modelo

O *stacking* obteve a maior acurácia publicada (0,98), e o RF foi o melhor classificador individual (0,97); porém o artigo não informa configuração suficiente do RF, nem todos os detalhes operacionais do *stacking*. Entre os modelos individuais com parâmetros explicitados, escolhemos o **Multilayer Perceptron (MLP)**: o texto define camadas ocultas `a`, taxa de aprendizagem `0,3`, momento `0,2` e 500 épocas. Sua acurácia (0,92) e AUC média (0,929) na Tabela 2 superam as do J48, também descrito (0,91 e 0,927). Essa escolha privilegia uma tentativa auditável, sem procurar parâmetros que maximizem o resultado neste CSV. O MLP deste experimento serve à comparação metodológica; a extensão XAI permanece no RF do projeto Python.

## Protocolo implementado

1. [`exportar_arff.py`](exportar_arff.py) seleciona `age > 18`, retira `id`, preserva as dez entradas e `stroke`, declara as categorias como nominais e mantém ausências de IMC como `?`.
2. [`ExperimentoWeka.java`](ExperimentoWeka.java) usa `ReplaceMissingValues` do WEKA na coorte completa. Essa é uma decisão necessária: há **180 IMCs ausentes** entre os **4.194 adultos** deste CSV; o artigo descreve **3.254 adultos sem ausências** e não fornece uma regra para chegar a essa coorte. WEKA substitui o IMC numérico pela média, conforme o filtro padrão; portanto, não corresponde a uma imputação especificada pelos autores.
3. O pacote **SMOTE 1.0.3 do WEKA** gera 3.700 exemplos da classe positiva com `-P 1498`, cinco vizinhos e semente 42, levando as 247 observações positivas a 3.947 e totalizando **7.894** registros balanceados. O artigo reporta 6.148 após SMOTE, pois usa outra coorte.
4. O MLP do WEKA usa os quatro parâmetros publicados, demais opções padrão da versão 3.8.6 e semente 42. A avaliação principal usa **10 dobras sobre a coorte previamente balanceada**, conforme a ordem descrita no artigo. Todas as métricas de precisão, recall, F1 e AUC usam explicitamente `stroke=1`; acurácia é global.
5. Uma segunda CV de dez dobras, sem SMOTE, fornece um contraste dentro do WEKA. Ela ainda usa imputação calculada na coorte inteira e não deve ser apresentada como avaliação completamente livre de vazamento.

**Limite central:** ao fazer SMOTE antes das dobras, os conjuntos de validação contêm registros sintéticos possivelmente relacionados a registros de treino. O resultado pode ficar otimista. A avaliação em teste intocado e o SMOTENC dentro das dobras estão documentados no [projeto Python](../projeto-python/README.md); não são diretamente comparáveis aos valores balanceados aqui.

## Resultados

Os resultados gerados ficam em [`resultados/metricas.json`](resultados/metricas.json). A comparação deve levar em conta que a **Tabela 2 traz médias**, e o programa aqui calcula métricas da classe positiva sobre as previsões agregadas das dez dobras. O artigo também apresenta valores distintos na Tabela 3 para essa classe.

| Indicador | MLP no artigo (Tabela 2) | MLP WEKA: SMOTE antes da CV | MLP WEKA: sem SMOTE |
| --- | ---: | ---: | ---: |
| Acurácia | 0,920 | **0,873** | 0,927 |
| Precisão | 0,884 (média) | **0,846** | 0,146 |
| Recall | 0,881 (média) | **0,911** | 0,049 |
| F1 | 0,881 (média) | **0,877** | 0,073 |
| AUC | 0,929 (média) | **0,918** | 0,712 |

As Figuras 5 e 6 do artigo apresentam valores próprios da **classe AVC**; para o MLP, a Figura 6 mostra precisão **0,851** e recall **0,924**. Nessa comparação mais direta, os nossos **0,846** e **0,911** estão próximos. A precisão, o recall e o F1 da Tabela 2 são *médias*, por isso seus números não devem ser tratados como metas exatas da classe positiva.

No protocolo pré-balanceado, a matriz agregada foi **TN 3.291, FP 656, FN 350, TP 3.597**. O total de 3.947 positivos inclui **3.700 casos sintéticos**; esses 3.597 acertos não representam 3.597 pacientes reais com AVC. Sem SMOTE, a matriz foi **TN 3.877, FP 70, FN 235, TP 12**: apenas **12 dos 247** positivos originais foram identificados. A acurácia maior nesse cenário é enganosa para a classe minoritária; prever sempre `stroke=0` acertaria 3.947/4.194 (94,09%).

## Executar no Windows

Requer Python 3 (biblioteca padrão), JDK com `java` e `javac` no `PATH`, CPU e acesso inicial ao Maven Central. Na raiz do repositório:

```powershell
.\experimento-weka\executar.ps1
```

O script baixa WEKA 3.8.6, o pacote SMOTE 1.0.3 e `bounce` 0.18 para `.tmp/`, compila o Java em `experimento-weka/.build/` e grava as métricas em JSON. Os JARs e artefatos gerados ficam fora do controle de versão; a fonte e as versões estão fixadas no roteiro. A execução original usou OpenJDK 25 em Windows, com `-Xmx4g`.

SHA-256 dos JARs usados: `weka-stable-3.8.6.jar` `932EA2F342B58FE45736389E9C426D5B5955E610D1F5F6485117F532068915E9`; `SMOTE-1.0.3.jar` `A562C27711762B058C694B2A942BA28786C714EA6B9F4DE186F55D69AD8D9842`; `bounce-0.18.jar` `BFFFF1505335C02256B7AB2CCFFBE4AA4D3AC9FE14C17557809B7C9D99D666CA`.

## Interpretação

Mesmo uma aproximação numérica ao artigo não demonstraria validade clínica: a coorte disponível difere da descrita, a procedência do dataset foi questionada por [Gibson et al. (2026)](https://doi.org/10.1186/s12916-026-04981-y), o pré-balanceamento pode inflar a CV, e a documentação do artigo não permite réplica exata. Um resultado divergente também é informativo sobre a reprodutibilidade do método publicado.

**Conclusão do experimento:** a reprodução aproximou a precisão e o recall da classe AVC mostrados nas figuras do artigo e o F1/AUC médios da Tabela 2, mas não sua acurácia. Como a coorte, a imputação, as sementes e detalhes do SMOTE não coincidem ou não foram especificados, não é possível atribuir a diferença de acurácia a uma causa única. A queda drástica de recall quando se retiram os sintéticos reforça que a proximidade das métricas no protocolo pré-balanceado não valida a predição sobre pacientes originais.

Fontes do ambiente: [artigo base](https://doi.org/10.3390/s22134670), [WEKA no Maven Central](https://central.sonatype.com/artifact/nz.ac.waikato.cms.weka/weka-stable/3.8.6), [pacotes oficiais do WEKA](https://weka.sourceforge.io/packageMetaData/).
