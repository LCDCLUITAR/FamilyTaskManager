factory.factory('authService', function ($state, $firebaseAuth, $ionicPopup, $ionicLoading, $q, msgService){
    var firebaseAuth = $firebaseAuth();
    var logged = false;
    var member = {};
    var that = this;
    var ownerPassed = false;

    this.createFamilyRoom = function(familyRoom, family){
        if(familyRoom){
            var fam = firebase.database().ref('Families').push({
                ID: "0",
                FamilyName: familyRoom.name,
                FamilyCode: familyRoom.password,
                Roles: [
                    {
                        Role: "Owner",
                        Permisions:{
                            FamilyDeletion: true,
                            Add: true,
                            Delete: true,
                            Edit: true,
                            CanAssign: true
                        }
                    },
                    {
                        Role: "Admin",
                        Permisions:{
                            FamilyDeletion: false,
                            Add: true,
                            Delete: true,
                            Edit: true,
                            CanAssign: true
                        }
                    },
                    {
                        Role: "Member",
                        Permisions:{
                            FamilyDeletion: false,
                            Add: false,
                            Delete: false,
                            Edit: false,
                            CanAssign: false
                        }
                    }
                ]
            });
            var famID = fam.key;
            firebase.database().ref('Families/'+famID).update({ID: famID});
            if(family.length > 0){
                $ionicLoading.show({
                    template: '<div class="loader"><ion-spinner icon="lines" class="spinner-positive"></ion-spinner> <br>Loading data...</div>',
                    noBackdrop: true,
                    animation: 'fade-in'
                });
                ownerPassed = false;
                this.createFamily(family, famID, familyRoom.password);
            }
        }
        else{
            msgService.showError("Unexpected error while creating family room.");
        }
    }
    this.createFamily = function(family, famRoomID, famPass){
        if(family.length > 0){
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();
            if(dd<10){
                dd='0'+dd;
            }
            if(mm<10){
                mm='0'+mm;
            }
            var today = dd+'/'+mm+'/'+yyyy;
            firebaseAuth.$createUserWithEmailAndPassword(family[0].email, famPass).then(function(){
                var memberInfo = firebaseAuth.$getAuth();
                // Update FamilyMembers on Families
                firebase.database().ref('Families/'+famRoomID+'/FamilyMembers/'+memberInfo.uid).set({
                    ID: memberInfo.uid,
                    Name: family[0].name,
                    Points: 0,
                    Role: family[0].role
                });
                var hasLogged = (!ownerPassed) ? true :  false;
                // Update Members
                firebase.database().ref('Members/'+memberInfo.uid).set({
                    ID: memberInfo.uid,
                    Name: family[0].name,
                    MemberSince: today,
                    hasLogged: hasLogged,
                    Points: 0,
                    Families: {ID: famRoomID, Notifications: true}
                });

                memberInfo.updateProfile({
                    displayName: family[0].name,
                }).then(function() {
                    if(!ownerPassed){
                        that.login({email: family[0].email, password: family[0].password});
                        ownerPassed = true;
                    }
                    if(family.length){
                        family.shift();
                        var nextMember = family;
                        that.createFamily(nextMember, famRoomID, famPass);
                    }
                }, function(error) {
                    console.log(`Error(${error.code}): ${error.message}`);
                    msgService.showError(`Error updating member name`);
                    $ionicLoading.hide();
                });
            }).catch(function(error){
                console.log(`Error(${error.code}): ${error.message}`);
                if(error.code == "auth/email-already-in-use"){
                    msgService.showError("Email is already in use.");
                    $ionicLoading.hide();
                }else{
                    msgService.showError(`Error creating member`);
                    $ionicLoading.hide();
                }
            });
        }
    }
    this.login = function(user){
        firebaseAuth.$signInWithEmailAndPassword(user.email, user.password).then(function(userInfo){
            // If no error
            logged = true;
            firebase.database().ref('Members/'+userInfo.uid).on('value',function(snap){
                if(snap.val()){
                    member.uid          = userInfo.uid;
                    member.displayName  = userInfo.displayName;
                    member.MemberSince  = snap.val().MemberSince;
                    member.Points       = snap.val().Points;
                    member.email        = userInfo.email;
                    member.Families     = snap.val().Families;
                    firebase.database().ref('Families/'+member.Families.ID).on('value',function(childSnap){
                        if(childSnap.val()){
                            member.Family = childSnap.val();
                            $ionicLoading.hide();
                            $state.go('tabsController.familyTasks');
                        }
                    });
                }
            });
        }).catch(function(error){
            $ionicLoading.hide();
            console.log(`Error(${error.code}): ${error.message}`);
            if(error.code == "auth/user-not-found"){
                msgService.showError("The user does not exist.");
            }
        });
    }
    this.getMember = function(){
        return member;
    }
    this.checkLogin = function(){
        var defer = $q.defer();
        firebase.auth().onAuthStateChanged(function(userInfo) {
            if (userInfo){
                firebase.database().ref('Members/'+userInfo.uid).on('value',function(snap){
                    if(snap.val()){
                        member.uid          = userInfo.uid;
                        member.displayName  = userInfo.displayName;
                        member.MemberSince  = snap.val().MemberSince;
                        member.Points       = snap.val().Points;
                        member.email        = userInfo.email;
                        member.Families     = snap.val().Families;
                        firebase.database().ref('Families/'+member.Families.ID).on('value',function(childSnap){
                            if(childSnap.val()){
                                member.Family = childSnap.val();
                                $ionicLoading.hide();
                                defer.resolve(member);
                                if($state.current.name == 'login' || $state.current.name == 'register'){
                                    $state.go('tabsController.familyTasks');
                                }
                            }
                        });
                    }
                });
            }
            else{
                //msgService.showError("Error while logging in. Try again");
                defer.resolve(false);
            }
        });
        return defer.promise;
    }
    this.resetPassword = function(email){
        if(email){
            firebaseAuth.$sendPasswordResetEmail(email).then(function() {
                msgService.showSuccess("A reset email has been sent to your email.");
            }, function(error) {
                msgService.showError("There was an error reseting your password.");
            });
        }
        else{
            msgService.showWarn("Please make sure to enter an Email Address.");
        }
    }
    this.logout = function(){
		firebase.auth().signOut().then(function() {
  			$state.go('login');
		}, function(error) {
			msgService.showError("An error occurred while logging out");
		});
    }
    return this;
});
