const express = require('express');
const router = express.Router();
const Actor = require('../models/actor');
const jsonParser = require('body-parser').json();

router
    .get('/:id', (req, res, next) => {
        Actor.findById(req.params.id)
            .lean()
            .then(actor => {
                if(!actor) res.status(404).send(`Cannot GET ${req.params.id}`);
                else res.send(actor);
            })
            .catch(next);


    })
    .get('/', (req, res, next) => {
        Actor.find()
            .lean()
            .select('name dob pob __v')
            .then(actors => res.send(actors))
            .catch(next);

    })
    .use(jsonParser)

    .post('/', (req, res, next) => {
        const actor = new Actor(req.body);
        actor
            .save()
            .then(actor => res.send(actor))
            .catch(next);
    });


module.exports = router;