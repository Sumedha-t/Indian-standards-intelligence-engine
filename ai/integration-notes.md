\# AI Retrieval Integration Notes



\## AI pipeline entry point



```python

from ai.pipeline import analyze\_requirement



result = analyze\_requirement(

&#x20;   query=normalized\_product\_text,

&#x20;   top\_k=10,

)

