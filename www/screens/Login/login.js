controller.controller('loginCtrl', function ($scope, $stateParams, $state, authService, msgService) {
    authService.checkLogin();
    $scope.login = function(member){
        if(typeof member === 'undefined'){
            msgService.showError("Fill out all the inputs.");
        }
        // Check valid user email
        // Check valid user password
        authService.login({email: member.email, password: member.password});
    };
});
