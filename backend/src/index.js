const app = require('./app');
const environment = require('./config/environment');

const PORT = environment.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Entorno: ${environment.NODE_ENV}`);
});
