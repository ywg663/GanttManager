'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const projectModel = require('../model/ProjectModel');

const socket = require('socket.io-client');
let sockets = [];
let client = socket.connect('https://c9.seefox.fr', {
  reconnect: true
});

const serviceName = "qwertyuiop";


client.on('connect', () => {
  console.log('connected')

  client.emit('needHelp');
});


client.on('info', (data) => {
  console.log(data);
})

module.exports = (router) => {
  console.log('yo');
  let server = require('http').Server(router);
  let io = require('socket.io')(server);


  io.on('connect', (socket) => {
    let temp = {};
    temp.socket = socket;
    temp.projectName = socket.handshake.query['projectName'];
    sockets.push(temp);
  });

  io.on('disconnect', (socket) => {
    sockets.splice(sockets.indexOf(socket), 1);
  });


  /* GET projects listing. */
  router.get('/project', function(req, res, next) {
    console.log('/project');
    res.render('project/index', {
      title: 'Express'
    });
  });

  router.get('/project/test', function(req, res, next) {
    var testObjectTMP = {
      nameService: "serviceName",
        name: "projet de test",
        desc: "Description du projet, blablabla...",
        daysOff: {
          Mo: true,
          Tu: true,
          We: true,
          Th: true,
          Fr: true,
          Sa: false,
          Su: false
        },
        workingHours: {
          start: 8,
          end: 18
        },
        task: [{
          id: 0,
          name: "tache 1",
          desc: "Init du projet",
          start: 1491673387558,
          end: 1491680626329,
          percentageProgress: 100,
          color: "#fc0202",
          linkedTask: [{
            to: "tache 2"
          }],
          ressources: ["Jérémy", "PC Razer A"]
        }, {
          id: 0,
          name: "tache 2",
          desc: "Réalisation du serveur central",
          start: 1491680626329,
          end: 1491684607029,
          percentageProgress: 100,
          color: "#fc0202",
          linkedTask: [{
            from: "tache 1"
          }, {
            to: "tache 3"
          }],
          ressources: ["Jérémy"]
        }, {
          id: 0,
          name: "tache 3",
          desc: "Calcul des prochains numéro du loto",
          start: 1491684607029,
          end: 1491691847051,
          percentageProgress: 50,
          color: "#fc0202",
          linkedTask: [{
            from: "tache 2"
          }, {
            to: "tache 4"
          }, {
            to: "tache x"
          }],
          ressources: ["Jérémy", "PC Razer B"]
        }],
        groupTask: [{
          name: "optional",
          start: Date.now(),
          end: Date.now()
        }],
        resources: [{
          name: "Jeremy",
          cost: 500,
          typeR: "humain"
        }, {
          name: "PC Razer A",
          cost: 1000,
          typeR: "materiel"
        }, {
          name: "PC Razer B",
          cost: 8000000000,
          typeR: "materiel"
        }],
        milestones: [{
          name: "jalon °1 (tirage du loto)",
          date: 1491697544976
        }]
    };
    projectModel.createProject(testObjectTMP, (data) => {
      console.log(data);
      res.send("test instert");
    });
  });


  router.get('/project/all', function(req, res, next) {
    console.log('/project/all');
    projectModel.getAllProjectsName((data) => {
      console.log(data);
      res.send(data);
    });
  });

  /* GET projects listing. */
  router.get('/project/:id', function(req, res, next) {
    projectModel.getProjectById(req.params.id, (data) => {
      res.render('project/index', {
        project: data
      });
    });
  });
  
  /*router.get('/project/:name', function(req, res) {
      var name = req.params.name;
      res.render('project/' + name);
    });*/

  router.get('/project/info/:id', function(req, res, next) {
    projectModel.getProjectById(req.params.id, (data) => {
      res.send(data);
    });
  });

  router.post('/', function(req, res, next) {
    let toSend = {};
    toSend.nameService = serviceName;
    toSend.projects = [];
    toSend.projects.push(req.body.project);
    req.body.project.serviceName = serviceName;
    projectModel.createProject(req.body.project, (data) => {
      updateService(toSend);
      res.send(data);
    });
  });

  router.put('/', function(req, res, next) {
    projectModel.updateProject(req.body.project, (data) => {
      updateService(req.body.project);
      sockets.forEach((s) => {
        if (s.projectName == req.body.project.name) {
          s.emit('updateProject', req.body.project);
        }
      });
      res.send(data);
    });
  });

  router.delete('/:id', function(req, res, next) {
    projectModel.deleteProject(req.params.id, (data) => {
      res.send(data);
    });
  });
};

function deleteService() {
  client.emit('deleteService', serviceName);
}

function updateService(data) {
  client.emit('sendUpdate', data);
}

client.on('errorOnProjectUpdate', (data) => {
  console.log(data);
});

client.on('projectUpdated', (data) => {
  for (let d in data) {
    projectModel.createExternalProject(d, (err, data) => {
      if (err)
        console.log(err)
    });
  }
});
