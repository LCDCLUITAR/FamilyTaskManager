controller.controller('registerCtrl', function ($scope, $stateParams, $state, authService, msgService){
    $scope.registerCtrl = {
        controller: {
            calls: {

            },
            actions: {
                checkNames: function(name, numChars = 2){
                    var regex = /^[a-zA-Z ]+$/g;
                    return (name && (name.length >= numChars) && regex.test(name)) ? true : false;
                },
                checkEmail: function(email){
                    var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/g;
                    return (email && regex.test(email)) ? true : false;
                },
                checkPassword: function(password){
                    var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})");
                    var mediumRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");
                    return (password && strongRegex.test(password)) ? true : false;
                }
            }
        },
        view:{
            init: function(){
                /***Variables***/
                // Bool for showing password
                $scope.showPass = false;
                $scope.showPass2 = false;
                // States in registration process (Used for cancel and next navigation)
                $scope.navState = 'family';
                // Holds family room info
                $scope.familyRoom = {name: "", password: "", password2: ""};
                // Holds family members info
                $scope.family = [{name: "", email: "", password: "", role: "Owner"}];
                /***Function calls***/
                $scope.registerCtrl.view.initFunctions();
                $scope.registerCtrl.view.initWatches();
            },
            initFunctions: function(){
                $scope.nav = function(direction, state){
                    // Go to login screen
                    if(direction == 'prev' && state == "family"){
                        $scope.navState = 'family';
                        // Ask user if he is sure only if there is info on fields
                        $state.go('login');
                    }
                    // Go to family section
                    else if(direction == 'prev' && state == "profile"){
                        $scope.navState = 'family';
                        // Ask user if he is sure only if there is info on fields
                    }
                    // Go to profile section
                    else if(direction == 'next' && state == "family"){
                        // Check if family info is set and passwords match
                        if(!$scope.registerCtrl.controller.actions.checkNames($scope.familyRoom.name, 2)){
                            msgService.showWarn("Family name must be at least 2 characters.\nFamily name cannot contain numbers.");
                        }
                        else if($scope.familyRoom.password != $scope.familyRoom.password2){
                            msgService.showWarn("Passwords do not match.");
                        }
                        else if(!$scope.registerCtrl.controller.actions.checkPassword($scope.familyRoom.password)){
                            msgService.showWarn("Family password must be 6 characters.\nContain at least 1 uppercase character.\nContain at least 1 lowercase character\nContain at least 1 number.");
                        }
                        else{
                            $scope.navState = 'profile';
                        }
                    }
                    // Go to family tasks (home)
                    else if(direction == 'next' && state == "profile"){
                        var valid = true;
                        for(var i = 0; i < $scope.family.length; i++){
                            if(!$scope.registerCtrl.controller.actions.checkNames($scope.family[i].name)){
                                valid = false;
                                msgService.showWarn("Name must be at least 2 characters.");
                                break;
                            }
                            else if(!$scope.registerCtrl.controller.actions.checkEmail($scope.family[i].email)){
                                valid = false;
                                msgService.showWarn("Email is not valid.");
                                break;
                            }
                            else if(!$scope.registerCtrl.controller.actions.checkPassword($scope.family[i].password, 6)){
                                valid = false;
                                msgService.showWarn("Family password must be 6 characters.\nContain at least 1 uppercase character.\nContain at least 1 lowercase character\nContain at least 1 number.");
                                break;
                            }
                            else if(!$scope.registerCtrl.controller.actions.checkNames($scope.family[i].role, 4)){
                                valid = false;
                                msgService.showWarn("Role must be at least 4 characters.");
                                break;
                            }
                        }
                        if($scope.family[0].role == 'Owner' && valid){
                            $scope.register($scope.familyRoom, $scope.family);
                        }
                    }
                };
                $scope.addFamMember = function(){
                    if($scope.family[$scope.family.length-1].name &&
                        $scope.family[$scope.family.length-1].email &&
                        $scope.family[$scope.family.length-1].password &&
                        $scope.family[$scope.family.length-1].role){
                        $scope.family.push({name: "", email: "", password: $scope.familyRoom.password, role: "Member"});
                    }
                    else{
                        msgService.showWarn("Previous family member needs to be completely filled before adding a new one.");
                    }
                };
                $scope.removeFamMember = function(idx){
                    $scope.family.splice(idx, 1);
                };
                $scope.register = function(familyRoom, family){
                    authService.createFamilyRoom(familyRoom, family);
                    $scope.navState = 'family';
                    /*$timeout(function () {
                        authService.login({email: family[0].email, password: family[0].password});
                    }, 2000);*/
                }
            },
            initWatches: function(){

            }
        }
    };
    $scope.registerCtrl.view.init();
});
