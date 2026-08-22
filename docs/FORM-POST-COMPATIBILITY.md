# Form POST compatibility

Dynamic form field names used by traveller pricing, departure pricing and traveller booking use `__` as the scope separator instead of `:`.

This keeps the multipart form payload compatible with reverse proxies and web-application firewalls that may reject or interfere with colon characters in parameter names. Server-side parsers retain a compatibility fallback for the earlier colon-delimited field names during the transition.
