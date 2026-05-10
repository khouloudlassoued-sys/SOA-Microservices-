// Les résolveurs contiennent la logique métier de chaque opération

// Données en mémoire (pas de BDD pour cet exple  )
let tasks = [
  {
    id: '1',
    title: 'Développement Front-end pour Site E-commerce',
    description: 'Créer une interface utilisateur réactive en utilisant React et Redux pour un site e-commerce.',
    completed: false,
    duration: 5
  },
  {
    id: '2',
    title: 'Développement Back-end pour Authentification Utilisateur',
    description: "Implémenter un système d'authentification et d'autorisation pour une application web en utilisant Node.js, Express, et Passport.js",
    completed: false,
    duration: 10
  },
  {
    id: '3',
    title: 'Tests et Assurance Qualité pour Application Web',
    description: 'Développer et exécuter des plans de test et des cas de test complets.',
    completed: false,
    duration: 8
  
  },
];

const taskResolver = {
  Query: {
    // Récupérer une tâche par ID
    task: (_, { id }) => tasks.find(task => task.id === id),
    // Récupérer toutes les tâches
    tasks: () => tasks,
  },
  Mutation: {
    // Ajouter une nouvelle tâche
    addTask: (_, { title, description, completed, duration}) => {
      const task = {
        id: String(tasks.length + 1),
        title,
        description,
        completed,
        duration,
      };
      tasks.push(task);
      return task;
    },
    // Marquer une tâche comme terminée
    completeTask: (_, { id }) => {
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        tasks[taskIndex].completed = true;
        return tasks[taskIndex];
      }
      return null;
    },

    changeDescription: (_, { id, description }) => {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].description = description;
        return tasks[taskIndex];
    }
    return null;
    },

deleteTask: (_, { id }) => {
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex !== -1) {
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);  // supprime du tableau
    return deletedTask;
  }
  return null;
},
  },
};

module.exports = taskResolver;