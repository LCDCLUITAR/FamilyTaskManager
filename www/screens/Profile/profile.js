controller.controller('profileCtrl', function ($scope, $stateParams, authService, msgService, safeApply, $timeout) {
    //var member = JSON.parse(window.localStorage.getItem("member"));
    // console.log("Member "+JSON.stringify(member));
    var profileCtrl = {
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
                },
                reset: function(){
                    $scope.photoURL = $scope.member.photoURL;
                    $scope.new = {
                        Name: $scope.member.displayName,
                        oldEmail: $scope.member.email,
                        Email: $scope.member.email,
                        oldPassword: "",
                        newPassword: "",
                        newPassword2: "",
                        photoChanged: false,
                        photoURL: $scope.member.photoURL
                    };
                }
            }
        },
        view:{
            init: function(){
                // Check valid user email and valid user password
                authService.checkLogin().then(function(res){
                    if(res){
                        /***Variables***/
                        $scope.member = res;
                        $scope.member["Role"] = res.Family.FamilyMembers[res.uid].Role;
                        $scope.photoURL = $scope.member.photoURL;
                        /***Functions***/
                        profileCtrl.view.initFunctions();
                        profileCtrl.view.initVariables();
                        profileCtrl.view.initWatches();
                    }
                });
            },
            initVariables: function(){
                $scope.isEdit = false;
                $scope.new = {
                    Name: $scope.member.displayName,
                    oldEmail: $scope.member.email,
                    Email: $scope.member.email,
                    oldPassword: "",
                    newPassword: "",
                    newPassword2: "",
                    photoChanged: false,
                    photoURL: $scope.member.photoURL
                };
            },
            initFunctions: function(){
                $scope.edit = {
                    isEdit: function(){
                        return $scope.isEdit;
                    },
                    setEdit: function(mode){
                        $scope.isEdit = mode;
                    }
                };
                $scope.updateMyProfile = function(newData){
                    newData.photoURL = $scope.photoURL;
                    var profiledata = newData;
                    if($scope.member.displayName.toLowerCase() != newData.Name.toLowerCase() &&
                        profileCtrl.controller.actions.checkNames(newData.Name)){
                        authService.updateMyProfile(profiledata, 'name');
                    }
                    if($scope.member.email.toLowerCase() != newData.Email.toLowerCase() &&
                        profileCtrl.controller.actions.checkEmail(newData.Email)){
                        authService.updateMyProfile(profiledata, 'email');
                    }
                    if(newData.newPassword.toLowerCase() == newData.newPassword2.toLowerCase() &&
                        profileCtrl.controller.actions.checkPassword(newData.newPassword)){
                        authService.updateMyProfile(profiledata, 'password');
                    }
                    if(newData.photoChanged){
                        authService.updateMyProfile(profiledata, 'photo');
                    }
                    msgService.showSuccess("Updated", "Profile updated succesfully!");
                    $timeout(function(){
                        $('#cancel').click();
                    },1000);
                    profileCtrl.controller.actions.reset();
                };
                $scope.editPhoto = function(){
                    $('#fileInputPhoto').click();
                    $scope.new.photoChanged = true;
                };
                $scope.uploadPhoto = function(file){
                    //console.log(file[0]);
                    var uploadTask = fireStor.child("ProfilePics/"+$scope.member.uid).put(file[0]);
                    uploadTask.on('state_changed', function(snapshot){
                        // Observe state change events such as progress, pause, and resume
                        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        //console.log('Upload is ' + progress + '% done');
                    }, function(error) {
                        // Handle unsuccessful uploads
                    }, function() {
                        var downloadURL = uploadTask.snapshot.downloadURL;
                        $scope.photoURL = downloadURL;
                        safeApply($scope);
                    });
                };
                $scope.logout = function(){
                  authService.logout();
                };
                $scope.deleteProfile = function(){
                    function processDeletion(res){
                        if(res){
                            authService.deleteProfile();
                            $timeout(function(){
                                msgService.showSuccess("Deleted", "Profile has been deleted!");
                            },500);
                        }
                    };
                    msgService.showConfirmProfileDeletion(processDeletion);
                };
            },
            initWatches: function(){

            }
        }
    };
    profileCtrl.view.init();
})
.directive("filesInput", function() {
    return {
        require: "ngModel",
        link: function postLink(scope,elem,attrs,ngModel) {
            elem.on("change", function(e) {
                var files = elem[0].files;
                ngModel.$setViewValue(files);
            })
        }
    }
});
