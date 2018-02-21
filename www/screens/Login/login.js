controller.controller('loginCtrl', function ($scope, $stateParams, $state, authService, msgService) {
    authService.checkLogin();
    $scope.login = function(member){
        // Check valid user email
        // Check valid user password
        authService.login({email: member.email, password: member.password});
    };
});
