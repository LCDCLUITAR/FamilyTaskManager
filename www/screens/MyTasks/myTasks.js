controller.controller('myTasksCtrl', function ($scope, $stateParams, authService) {
    var myTasksCtrl = {
        controller: {
            calls: {

            },
            actions: {

            }
        },
        view:{
            init: function(){
                // Check valid user email and valid user password
                authService.checkLogin().then(function(member){
                    if(member){
                        /***Variables***/
                        $scope.member = member;
                        /***Functions***/
                        myTasksCtrl.view.initWatches();
                        myTasksCtrl.view.initFunctions();
                    }
                });
            },
            initFunctions: function(){
            },
            initWatches: function(){

            }
        }
    };
    myTasksCtrl.view.init();
});
