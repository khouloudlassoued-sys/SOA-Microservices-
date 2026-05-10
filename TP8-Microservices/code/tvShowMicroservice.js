const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
// Charger le fichier tvShow.proto
const tvShowProtoPath = 'tvShow.proto';
const tvShowProtoDefinition = protoLoader.loadSync(tvShowProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const tvShowProto = grpc.loadPackageDefinition(tvShowProtoDefinition).tvShow;

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/tp-microservices')
    .then(() => console.log('Connecté à MongoDB (tvshows)'))
    .catch(err => console.error('Erreur MongoDB:', err));

// Schéma et modèle TVShow
const tvShowSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
});
const TVShow = mongoose.model('TVShow', tvShowSchema);

// Implémenter le service de séries TV
const tvShowService = {
    getTvshow: async (call, callback) => {
        try {
            const tv_show = await TVShow.findById(call.request.tv_show_id);
            if (!tv_show) {
                return callback({ code: grpc.status.NOT_FOUND, message: 'Série TV non trouvée' });
            }
            callback(null, { tv_show: { id: tv_show._id.toString(), title: tv_show.title, description: tv_show.description } });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
    searchTvshows: async (call, callback) => {
        try {
            const { query } = call.request;
            const filter = query
                ? { $or: [{ title: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }] }
                : {};
            const tv_shows = await TVShow.find(filter);
            callback(null, { tv_shows: tv_shows.map(s => ({ id: s._id.toString(), title: s.title, description: s.description })) });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
    createTvshow: async (call, callback) => {
        try {
            const tv_show = new TVShow({ title: call.request.title, description: call.request.description });
            await tv_show.save();
            console.log(`Série créée : ${tv_show.title}`);
            callback(null, { tv_show: { id: tv_show._id.toString(), title: tv_show.title, description: tv_show.description } });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
    updateTvshow: async (call, callback) => {
        try {
            const tv_show = await TVShow.findByIdAndUpdate(
                call.request.tv_show_id,
                { title: call.request.title, description: call.request.description },
                { new: true }
            );
            if (!tv_show) {
                return callback({ code: grpc.status.NOT_FOUND, message: 'Série TV non trouvée' });
            }
            console.log(`Série mise à jour : ${tv_show.title}`);
            callback(null, { tv_show: { id: tv_show._id.toString(), title: tv_show.title, description: tv_show.description } });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
    deleteTvshow: async (call, callback) => {
        try {
            const tv_show = await TVShow.findByIdAndDelete(call.request.tv_show_id);
            if (!tv_show) {
                return callback({ code: grpc.status.NOT_FOUND, message: 'Série TV non trouvée' });
            }
            console.log(`Série supprimée : id=${call.request.tv_show_id}`);
            callback(null, { success: true });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
};
// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(tvShowProto.TVShowService.service, tvShowService);
const port = 50052;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Échec de la liaison du serveur:', err);
            return;
        }
        console.log(`Le serveur s'exécute sur le port ${port}`);
    });
console.log(`Microservice de séries TV en cours d'exécution sur le port  ${port}`);
