/* jshint undef: true, unused: true */
/* globals $, XMLHttpRequest*/

//
// Define our Web Data Connector
(function () {




  $(document).ready(function() {

  });



// Authenticate user

  var authSettings = {
    requestingAppId: 'tableau-demo',
    requestedPermissions: [
      {
        streamId: '*',
        level: 'read'
      }
    ],
    // set this if you don't want a popup
    returnURL: 'auto#',
    // use the built-in auth button (optional)
    spanButtonID: 'pryv-button',
    callbacks: {
      initialization: function () { },
      // optional; triggered if the user isn't signed-in yet
      needSignin: function(popupUrl, pollUrl, pollRateMs) {

      },
      needValidation: null,
      signedIn: onSignedIn,
      refused: function (reason) { },
      error: function (code, message) { }
    }
  };

  pryv.Auth.setup(authSettings);


  function getPYConnection() {


    return pyConnection;
  }



  /**
   * @param {Pryv.Connection} connection
   * @param {string} langCode
   */
  function onSignedIn(connection, langCode) {
    console.log('Signed in!');
    pyConnection = connection;
    conn = connection;
    getPYConnection();


    powerbiAPI =  $('#powerbiAPI').val();

    if (! powerbiAPI) {
      alert('missing powerbiAPI');
      return;
    }

    let filter = new pryv.Filter({limit: 2});
    let monitor = conn.monitor(filter);


//This will use the local cache before fetching data online, default is true
    monitor.useCacheForEventsGetAllAndCompare = false;
// This will fetch all events on start up, default is true
    monitor.ensureFullCache = false;
// This will optimize start up by prefecthing some events, default is 100
    monitor.initWithPrefetch = 2;


    var onLoad = pryv.MESSAGES.MONITOR.ON_LOAD;
    monitor.addEventListener(onLoad, function (events) {
      //console.log('got events', events)
    });

    var onError = pryv.MESSAGES.MONITOR.ON_ERROR;
    monitor.addEventListener(onError, function (error) {
      console.log('got err', error)
    });


    var addNumericalCounter = 0;

    var onEventChange = pryv.MESSAGES.MONITOR.ON_EVENT_CHANGE;
    monitor.addEventListener(onEventChange, function (changes) {

      var numsAdd = [];

      ['created', 'modified', 'trashed'].forEach(function (action) {
        changes[action].forEach(function (event) {


          if (!isNaN(parseFloat(event.content)) && isFinite(event.content)) { {

              numsAdd.push({
                streamId: event.streamId,
                time:  new Date(event.time * 1000),
                type: event.type,
                content: event.content
              });
            }
          }
        });

        if (numsAdd.length > 0) {
          $('#dataCount').text(addNumericalCounter += numsAdd.length);
          $.ajax({
            type: 'POST',
            url: powerbiAPI,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ rows: numsAdd}),
            dataType: "json",
            success: function(data){console.log('success', data)},
            failure: function(errMsg) {console.log('success', errMsg)}
          });

        }

      });
    });

    monitor.start(function (err) {
      if (err) console.log('error on start', err)
    });
  }
})();

