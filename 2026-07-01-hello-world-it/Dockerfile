# Schlanker statischer Server für die Hello-World-Seite.
# nginx-unprivileged lauscht standardmäßig auf 8080 und läuft als non-root.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY index.html /usr/share/nginx/html/index.html

EXPOSE 8080
