controller.controller('familyCtrl', function ($scope, $stateParams, authService) {
    var familyCtrl = {
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
                        $scope.family = Object.values(member.Family.FamilyMembers);
                        /***Functions***/
                        familyCtrl.view.initFunctions();
                        familyCtrl.view.initVariables();
                        familyCtrl.view.initWatches();
                    }
                });
            },
            initVariables: function(){
                $scope.tab = 'Family';
                $scope.memberInfo;
                firebase.database().ref('Members/').on('value',function(snap){
                    if(snap.val()){
                        $scope.memberInfo = Object.values(snap.val()).filter(o => o.Families.ID == $scope.member.Family.ID);
                    }
                });
                firebase.database().ref('Tasks/'+$scope.member.Family.ID).on('value',function(snap){
                    if(snap.val()){
                        var tasks = Object.values(snap.val()).filter(o =>
                            (typeof o.AssignedTo != 'undefined') && !o.Completed
                        );
                        for (var i = 0; i < $scope.family.length; i++) {
                            $scope.family[i]["TaskCount"] = 0;
                        }
                        if(tasks.length){
                            for (var i = 0; i < tasks.length; i++) {
                                for (var j = 0; j < tasks[i].AssignedTo.length; j++) {
                                    var idx = $scope.family.findIndex(o => o.ID == tasks[i].AssignedTo[j].UserID);
                                    if(idx != -1){
                                        $scope.family[idx].TaskCount++;
                                    }
                                }
                            }
                        }
                    }
                });
            },
            initFunctions: function(){
                $scope.getPhoto = function(uid){
                    if(!$scope.memberInfo) return "https://firebasestorage.googleapis.com/v0/b/familytasksmanager.appspot.com/o/default_user_icon.png?alt=media&token=813a45a9-ee2c-47c6-9096-2d51f27638ef";
                    var r = $scope.memberInfo.filter(o => o.ID == uid)[0].photoURL;
                    return r;
                };
                $scope.tabNav = {
                    isTab: function(tab){
                        return $scope.tab == tab;
                    },
                    setTab: function(tab){
                        $scope.tab = tab;
                    }
                };
            },
            initWatches: function(){
                $scope.$on('member-updated', function(event, update) {
                    $scope.member = update.info;
                    $scope.family = Object.values(update.info.Family.FamilyMembers);
                    console.log('member updated');
                });
            }
        }
    };
    familyCtrl.view.init();
});
