const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// Charger les fichiers proto pour les films et les séries TV
const movieProtoPath = 'movie.proto';
const tvShowProtoPath = 'tvShow.proto';
const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const tvShowProtoDefinition = protoLoader.loadSync(tvShowProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;
const tvShowProto = grpc.loadPackageDefinition(tvShowProtoDefinition).tvShow;
// Définir les résolveurs pour les requêtes GraphQL
const resolvers = {
    Query: {
        movie: (_, { id }) => {
// Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.getMovie({ movie_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movie);
                    }
                });
            });
        },
        movies: () => {
// Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.searchMovies({}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movies);
                    }
                });
            });
        },
        tvShow: (_, { id }) => {
// Effectuer un appel gRPC au microservice de séries TV
            const client = new tvShowProto.TVShowService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.getTvshow({ tv_show_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_show);
                    }
                });
            });
        },
        tvShows: () => {
// Effectuer un appel gRPC au microservice de séries TV
            const client = new tvShowProto.TVShowService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.searchTvshows({}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_shows);
                    }
                });
            });
        },
    },
    Mutation: {
        createMovie: (_, { title, description }) => {
// Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.createMovie({ title, description }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movie);
                    }
                });
            });
        },
        updateMovie: (_, { id, title, description }) => {
// Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.updateMovie({ movie_id: id, title, description }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movie);
                    }
                });
            });
        },
        deleteMovie: (_, { id }) => {
// Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.deleteMovie({ movie_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ success: response.success });
                    }
                });
            });
        },
        createTVShow: (_, { title, description }) => {
// Effectuer un appel gRPC au microservice de séries TV
            const client = new tvShowProto.TVShowService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.createTvshow({ title, description }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_show);
                    }
                });
            });
        },
        updateTVShow: (_, { id, title, description }) => {
// Effectuer un appel gRPC au microservice de séries TV
            const client = new tvShowProto.TVShowService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.updateTvshow({ tv_show_id: id, title, description }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_show);
                    }
                });
            });
        },
        deleteTVShow: (_, { id }) => {
// Effectuer un appel gRPC au microservice de séries TV
            const client = new tvShowProto.TVShowService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.deleteTvshow({ tv_show_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ success: response.success });
                    }
                });
            });
        },
    },
};
module.exports = resolvers;
