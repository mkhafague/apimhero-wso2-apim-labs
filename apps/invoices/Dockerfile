# Invoices — backend métier d'exemple de la formation (zéro dépendance npm)
FROM node:22-alpine

WORKDIR /app
# Voir apps/petstore/Dockerfile : droits explicites, sinon EACCES sous `node`
# quand le contexte de build vient d'un hôte Windows.
COPY --chown=node:node package.json server.js ./
RUN chmod 0644 package.json server.js

ENV PORT=8080
EXPOSE 8080
USER node

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
