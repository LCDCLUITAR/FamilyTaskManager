controller.controller('profileCtrl', function ($scope, $stateParams, authService, msgService) {
    authService.checkLogin().then(function(res){
        if(res){
            console.log(res);
        }
    });
    $scope.logout = function(){
        authService.logout();
    };
});
