controller.controller('familyTasksCtrl', function ($scope, $stateParams, authService, msgService) {
    authService.checkLogin().then(function(res){
        if(res){
            console.log(res);
        }
    });
});
