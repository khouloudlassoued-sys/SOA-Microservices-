const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
// Charger le fichier movie.proto
const movieProtoPath = 'movie.proto';
const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/tp-microservices')
    .then(() => console.log('Connecté à MongoDB (movies)'))
    .catch(err => console.error('Erreur MongoDB:', err));

// Schéma et modèle Movie
const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
});
const Movie = mongoose.model('Movie', movieSchema);

// Implémenter le service movie
const movieService = {
    getMovie: async (call, callback) => {
        try {
            const movie = await Movie.findById(call.request.movie_id);
            if (!movie) {
                return callback({ code: grpc.status.NOT_FOUND, message: 'Film non trouvé' });
            }
            callback(null, { movie: { id: movie._id.toString(), title: movie.title, description: movie.description } });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
    searchMovies: async (call, callback) => {
        try {
            const { query } = call.request;
            const filter = query
                ? { $or: [{ title: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }] }
                : {};
            const movies = await Movie.find(filter);
            callback(null, { movies: movies.map(m => ({ id: m._id.toString(), title: m.title, description: m.description })) });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
    createMovie: async (call, callback) => {
        try {
            const movie = new Movie({ title: call.request.title, description: call.request.description });
            await movie.save();
            console.log(`Film créé : ${movie.title}`);
            callback(null, { movie: { id: movie._id.toString(), title: movie.title, description: movie.description } });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
    updateMovie: async (call, callback) => {
        try {
            const movie = await Movie.findByIdAndUpdate(
                call.request.movie_id,
                { title: call.request.title, description: call.request.description },
                { new: true }
            );
            if (!movie) {
                return callback({ code: grpc.status.NOT_FOUND, message: 'Film non trouvé' });
            }
            console.log(`Film mis à jour : ${movie.title}`);
            callback(null, { movie: { id: movie._id.toString(), title: movie.title, description: movie.description } });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
    deleteMovie: async (call, callback) => {
        try {
            const movie = await Movie.findByIdAndDelete(call.request.movie_id);
            if (!movie) {
                return callback({ code: grpc.status.NOT_FOUND, message: 'Film non trouvé' });
            }
            console.log(`Film supprimé : id=${call.request.movie_id}`);
            callback(null, { success: true });
        } catch (err) {
            callback({ code: grpc.status.INTERNAL, message: err.message });
        }
    },
// Ajouter d'autres méthodes au besoin
};
// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(movieProto.MovieService.service, movieService);
const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Échec de la liaison du serveur:', err);
            return;
        }
        console.log(`Le serveur s'exécute sur le port ${port}`);
    });
console.log(`Microservice de films en cours d'exécution sur le port ${port}`);
