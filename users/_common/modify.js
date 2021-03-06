// Needed to create the Modify information router
const express = require('express');
const router = express.Router();

const Form = require('../../files/_form');
const Selector = require('../profiles/_selector');



router.post('/course', (req, res) => {
  let formulario = new Form(req, () => {
    let select_user = new Selector(formulario._campos['id_usuario']);
    select_user.return_user().then((profile) => {
        let user = profile;
        user.modify_course(formulario._campos).then(() => {
            formulario = null;
            select_user = null;
            res.send({
              status: true
            });
          })
          .catch((err) => {
            formulario = null;
            select_user = null;
            user = null;
            res.send({
              error: err
            });
          });
      })
      .catch((err) => {
        res.send({
          error: err
        });
      });
  }, function (err) {
    res.send({
      error: err
    });
  });

});


router.post('/personal_info', (req, res) => {


  let select_user = new Selector(req.body.id_usuario);
  select_user.return_user().then((profile) => {
      let user = profile;
      user.modify_personal_info(req.body).then(() => {
          select_user = null;
          user._db_connection._close_connection();
          res.send({
            status: true
          });
        })
        .catch((err) => {
          select_user = null;
          user = null;
          res.send({
            error: err
          });
        });
    })
    .catch((err) => {
      res.send({
        error: err
      });
    });

});



router.post('/change_password', (req, res) => {

  let select_user = new Selector(req.body.id_usuario);
  select_user.return_user().then((profile) => {
      let user = profile;
      user.modify_password(req.body).then(() => {
          select_user = null;
          user._close_connections();
          res.send({
            status: true
          });
        })
        .catch((err) => {
          select_user = null;
          user._db_connection._close_connection();
          res.send({
            error: err
          });
        });
    })
    .catch((err) => {
      res.send({
        error: err
      });
    });

});


router.post('/avatar', (req, res) => {
  let select_user = new Selector(req.body['id_usuario']);
  select_user.return_user().then((profile) => {
      let user = profile;
      user.modify_avatar(req.body, req.body["urlAvatar"]).then(() => {
        select_user = null;
        user._close_connections();
        res.send({
          status: true
        });
      });
    })
    .catch((err) => {
      select_user = null;
      res.send({
        error: err
      });
    });

});





module.exports = router;
