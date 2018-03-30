controller.controller('settingsCtrl', function ($scope, $stateParams,authService,$state, msgService, safeApply, $timeout) {
    var settingsCtrl = {
        controller: {
            calls: {

            },
            actions: {
                checkNames: function(name, numChars = 2){
                    var regex = /^[a-zA-Z ]+$/g;
                    return (name && (name.length >= numChars) && regex.test(name)) ? true : false;
                },
                checkPassword: function(password){
                    var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})");
                    var mediumRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");
                    return (password && strongRegex.test(password)) ? true : false;
                },
                reset: function(){
                    $scope.newMember = {
                        name: '',
                        email: '',
                        role: 'Member'
                    };
                    $scope.addMemberModal = false;
                    $scope.saveActive = false;
                    $scope.new = {
                        FamilyName: $scope.member.Family.FamilyName,
                        Roles: $scope.member.Family.Roles,
                        oldPassword: '',
                        newPassword: '',
                        newPassword2: '',
                        FamilyMembers: $scope.family,
                        ResetFamilyPoints: false
                    };
                },
                checkInfoData: function(data){
                    if(data.FamilyName == '') return false;
                    if(data.FamilyName == $scope.member.Family.FamilyName) return false;
                    if(settingsCtrl.controller.actions.checkNames(data.FamilyName)){
                        firebase.database().ref('Families/'+$scope.member.Family.ID).update({FamilyName: data.FamilyName});
                        $scope.infoChanged = false;
                        msgService.showSuccess("Family info update was successful!");
                        return true;
                    }
                    else{
                        msgService.showWarn("Family name must be at least 2 characters.\nFamily name cannot contain numbers.");
                        return true;
                    }
                },
                checkPasswordData: function(data){
                    if(data.newPassword == '' && data.newPassword2 && data.oldPassword == '') return false;
                    if(data.newPassword == data.newPassword2) return false;
                    else msgService.showWarn("Password do not match. Try again.");
                    if(settingsCtrl.controller.actions.checkPassword(data.newPassword) &&
                        settingsCtrl.controller.actions.checkPassword(data.oldPassword)){
                        firebase.database().ref('Families/'+$scope.member.Family.ID+'/FamilyCode').once('value', function(snap){
                            if(snap.val()){
                                // TODO: Compare hashed passwords
                                if(data.oldPassword != snap.val()){
                                    msgService.showWarn("Family password does not match current family password.");
                                    return true;
                                }
                                else{
                                    // TODO: Hash password
                                    firebase.database().ref('Families/'+$scope.member.Family.ID).update({FamilyCode: data.newPassword});
                                    msgService.showSuccess("Family password update was successful!");
                                    return true;
                                }
                            }
                        });
                        $scope.infoChanged = false;
                        return true;
                    }
                    else{
                        msgService.showWarn("Family password must be 6 characters.\nContain at least 1 uppercase character.\nContain at least 1 lowercase character\nContain at least 1 number.");
                        return true;
                    }
                },
                checkRolesData: function(data){
                    var rolesI = $scope.rolesI;
                    for (var i = rolesI; i < data.Roles.length; i++) {
                        if(data.Roles[i]){
                            if(!settingsCtrl.controller.actions.checkNames(data.Roles[i].Role, 4)){
                                msgService.showWarn("Role must be at least 4 characters.\nRole cannot contain numbers.");
                                return true;
                            }
                            else if(!data.Roles[i].Role){
                                data.Roles.splice(i, 1);
                            }
                        }
                    }
                    firebase.database().ref('Families/'+$scope.member.Family.ID+'/Roles').set(JSON.parse(angular.toJson(data.Roles)));
                    msgService.showSuccess("Family password update was successful!");
                },
                checkMembersData: function(data){
                    for (var i = 0; i < data.FamilyMembers.length; i++) {
                        if(data.FamilyMembers[i].ID == -1){

                        }
                        else{
                            firebase.database().ref('Families/'+$scope.member.Family.ID+'/FamilyMembers/'+data.FamilyMembers[i].ID).update({
                                Role: data.FamilyMembers[i].Role
                            });
                        }
                    }
                    msgService.showSuccess("Family members have been updated successfully!");

                },
            }
        },
        view:{
            init: function(){
                $scope.editMode = 'info';
                /***Variables***/
                authService.checkLogin().then(function(res){
                    if(res){
                        settingsCtrl.view.initVariables(res);
                        settingsCtrl.view.initFunctions();
                        settingsCtrl.view.initWatches();
                    }
                });
            },
            initVariables: function(res) {
                $scope.member = res;
                $scope.memberCount = Object.values(res.Family.FamilyMembers).length;
                $scope.member.Family.Roles = Object.values($scope.member.Family.Roles);
                $scope.family = Object.values($scope.member.Family.FamilyMembers);
                for (var i = 0, j = 1; i < $scope.family.length; i++,j++) {
                    if($scope.family[i].Role == 'Owner')
                        $scope.family[i]["RoleIdx"] = 1;
                    else if($scope.family[i].Role == 'Admin')
                        $scope.family[i]["RoleIdx"] = 2;
                    else
                        $scope.family[i]["RoleIdx"] = 3;
                }
                $scope.rolesI = $scope.member.Family.Roles.length;
                $scope.new = {
                    FamilyName: $scope.member.Family.FamilyName,
                    Roles: $scope.member.Family.Roles,
                    oldPassword: '',
                    newPassword: '',
                    newPassword2: '',
                    FamilyMembers: $scope.family,
                    ResetFamilyPoints: false
                };
                $scope.addMemberModal = false;
                $scope.infoChanged = false;
            },
            initFunctions: function() {
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
                $scope.edit = {
                    isEdit: function(mode){
                        return mode == $scope.editMode;
                    },
                    setEdit: function(mode){
                        $scope.editMode = mode;
                        settingsCtrl.controller.actions.reset();
                    }
                };
                $scope.updateFamilyInfo = function(data){
                    console.log(data);
                    console.log($scope.editMode);
                    switch ($scope.editMode) {
                        case 'info':
                            settingsCtrl.controller.actions.checkInfoData(data);
                            break;
                        case 'password':
                            settingsCtrl.controller.actions.checkPasswordData(data);
                            break;
                        case 'roles':
                            settingsCtrl.controller.actions.checkRolesData(data);
                            break;
                        default:
                            settingsCtrl.controller.actions.checkMembersData(data);
                    };
                };
                $scope.resetFamilyPoints = function(){
                    var keys = Object.keys($scope.member.Family.FamilyMembers);
                    for (var i = 0; i < keys.length; i++) {
                        firebase.database().ref('Families/'+$scope.member.Family.ID+'/FamilyMembers/'+keys[i]).update({Points: 0});
                        msgService.showSuccess("Family points have been resetted to zero");
                    }
                };
                $scope.addNewRole = function(){
                    $scope.new.Roles.push({
                        Role: '',
                        Permisions: {
                            Add: false,
                            CanAssign: false,
                            Delete: false,
                            FamilyDeletion: false,
                            Edit: false
                        }
                    });
                };
                $scope.addNewMember = function(){
                    $scope.newMember = {name: '', email: '', role: 'Member'};
                    $scope.addMemberModal = true;
                };
                $scope.addFamMember = function(newMember){
                    console.log("Member");
                    console.log($scope.member);
                    var family = [{email: newMember.email, name: newMember.name, role: newMember.role, password: $scope.member.Family.FamilyCode}];
                    authService.addMember(family, $scope.member.Family.ID, $scope.member.Family.FamilyCode);
                    $scope.addMemberModal = false;
                };
                $scope.removeRole = function(idx){
                    $scope.new.Roles.splice(idx, 1);
                };
                $scope.isOwner = function(role){
                    return role == 'Owner';
                };
                $scope.modalAction = {
                    isModal: function(){return $scope.addMemberModal},
                    setModal: function(mode){$scope.addMemberModal = mode;}
                };
                $scope.deleteMember = function(uid){
                    function processDeletion(res){
                        if(res){
                            authService.deleteFamilyMember(uid);
                            $timeout(function(){
                                msgService.showSuccess("Deleted", "Profile has been deleted!");
                            },500);
                        }
                    };
                    msgService.showConfirmProfileDeletion(processDeletion);
                };
                $scope.isNotMe = function(uid){
                    return uid != $scope.member.uid;
                };
            },
            initWatches: function(){
                $scope.$watch('new', function(now, then){
                    if(now != then){
                        $scope.infoChanged = true;
                    }
                },true);
                $scope.$on('member-updated', function(event, update) {
                    var res = update.info;
                    console.log(res);
                    settingsCtrl.view.initVariables(res);
                });
            }
        }
    };
    settingsCtrl.view.init();
});
