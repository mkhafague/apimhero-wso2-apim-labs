# Petstore — backend d'exemple de la formation (zéro dépendance npm)
FROM node:22-alpine

WORKDIR /app
# COPY s'exécute en root et reprend les droits du contexte de build. Depuis un
# hôte Windows, ces droits ne veulent rien dire côté Linux : le fichier peut
# arriver illisible pour l'utilisateur `node`, d'où un EACCES sur server.js au
# démarrage. On fixe donc propriétaire ET mode explicitement, avant USER node.
COPY --chown=node:node package.json server.js ./
RUN chmod 0644 package.json server.js

ENV PORT=8080
EXPOSE 8080
USER node

# Node >= 18 embarque fetch : healthcheck sans installer curl dans l'image
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
