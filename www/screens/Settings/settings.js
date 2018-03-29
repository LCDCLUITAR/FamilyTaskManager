controller.controller('settingsCtrl', function ($scope, $stateParams,authService,$state) {
$scope.var = "fdsa";
  $scope.settingsCtrl = {
    controller: {
      calls: {

      },
      actions: {

      }
    }, view:{
      init: function(){
        /***Variables***/
          // States in registration process (Used for cancel and next navigation)
        $scope.navState = 'settings';
        $scope.remail1="shrestha_alish@hotmail.com";


        authService.checkLogin().then(function(res){
          if(res){
            $scope.displayName=res.displayName;
            $scope.age=res.age;
            $scope.email=res.email;
            $scope.uid=res.uid;
            $scope.password= res.password;

            $scope.newName=res.displayName;
            $scope.newAge=res.age;
            //$scope.newEmail=res.email;



            console.log(res);
          }
        });

        $scope.settingsCtrl.view.initFunctions();
        $scope.settingsCtrl.view.initWatches();
      },
      initFunctions: function() {
        $scope.logoutApp = function () {
          authService.logout();
          $state.go('login');
        }
        $scope.navToScreen = function (direction, state) {

          $state.go(state);

        };

        $scope.sendInvitation = function () {

          var params = {
            'sender': $scope.email,
            'receiver': $scope.remail1,
            message: ' hey you are invited to this ---> link  her ..... to join'
          };
          console.log("Params " + JSON.stringify(params));
          authService.sendEmail(params, function (data, status) {
            if (status == 200) {
              if (angular.isDefined(data)) {

                alert(data.message)
                $scope.remail = "";

              }
            }
          });


        };


      },
      initWatches: function(){
      }
    }
  };
    $scope.settingsCtrl.view.init();
}


  );
