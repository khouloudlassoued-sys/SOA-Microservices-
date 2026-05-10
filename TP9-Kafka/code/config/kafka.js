'use strict';
require('dotenv').config();
const { Kafka, logLevel } = require('kafkajs');

/**
 * Instance Kafka partagée pour le producteur et le consommateur.
 */
const kafka = new Kafka({
    clientId: 'tp9-kafka-app',
    brokers:  [process.env.KAFKA_BROKER || 'localhost:9092'],
    logLevel: logLevel.WARN,
    retry: {
        initialRetryTime: 300,
        retries: 5,
    },
});

const TOPIC      = process.env.KAFKA_TOPIC    || 'test-topic';
const GROUP_ID   = process.env.KAFKA_GROUP_ID || 'test-group';

module.exports = { kafka, TOPIC, GROUP_ID };
