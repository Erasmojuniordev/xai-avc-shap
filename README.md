# Projetos de predição de AVC

Este repositório reúne duas etapas independentes do trabalho da disciplina:

| Pasta | Conteúdo |
| --- | --- |
| [`projeto-python/`](projeto-python/) | Projeto concluído: Random Forest em Python, avaliação em teste separado e explicações SHAP globais e locais. Inclui o CSV, o artigo base e a apresentação crítica. |
| [`experimento-weka/`](experimento-weka/) | Experimento de reprodução aproximada no WEKA 3.8.6, com o MLP configurado conforme os parâmetros publicados. |

Comece pelo [relato do projeto Python](projeto-python/README.md) para entender a implementação de XAI. O [experimento WEKA](experimento-weka/README.md) investiga separadamente a divergência dos resultados reportados no artigo. Ambos usam o mesmo CSV disponível; nenhum deles valida um preditor para uso clínico.
