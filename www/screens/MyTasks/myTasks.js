controller.controller('familyCtrl', function ($scope, $stateParams, authService, safeApply) {
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
                $scope.tab = $scope.tab || 'Family';
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
                        $scope.family.sort(function(a, b){ return b.Points - a.Points});
                        var rank = 0;
                        for (var i = 0, j = 1; i < $scope.family.length; i++,j++) {
                            $scope.family[i]["TaskCount"] = 0;
                            if($scope.family[i].Role == 'Owner')
                                $scope.family[i]["RoleIdx"] = 1;
                            else if($scope.family[i].Role == 'Admin')
                                $scope.family[i]["RoleIdx"] = 2;
                            else
                                $scope.family[i]["RoleIdx"] = 3;
                            if(j < $scope.family.length){
                                if($scope.family[j-1].Points == $scope.family[j].Points)
                                    $scope.family[j-1]['PointsIdx'] = $scope.family[j]['PointsIdx'] = rank + 1;
                                else
                                    $scope.family[j-1]['PointsIdx'] = $scope.family[j]['PointsIdx'] = ++rank;
                            }
                        }
                        //console.log($scope.family);
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
                safeApply($scope);
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
                    familyCtrl.view.initVariables();
                });
            }
        }
    };
    familyCtrl.view.init();
});
