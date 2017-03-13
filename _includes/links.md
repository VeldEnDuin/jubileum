{%comment%}<!-- declare links enabled -->{%endcomment%}
{% for link in site.data.linkcode %}
    {% assign code = link[0] %}
    {% for langlink in link[1] %}
[{{code}}.{{langlink[0]}}]: {{langlink[1]}}
    {% endfor %}
{% endfor %}