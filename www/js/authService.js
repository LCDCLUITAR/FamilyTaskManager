factory.factory('authService', function ($state, $firebaseAuth, $ionicPopup, $ionicLoading, $q, msgService, $rootScope){
    var firebaseAuth = $firebaseAuth();
    var logged = false;
    var member = {};
    var that = this;
    var ownerPassed = false;

    this.sendEmail = function(data,success,error){
        header={'Content-Type':'application/x-www-form-urlencoded','Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
        $http({
            method: 'POST',
            url: 'http://srvpp.online/demoemail.php',
            headers: header,
            data: data,
            dataType: "json"
        }).
        success(function (data, status, headers, config) {
            header = {};
            success(data, status, headers, config);
        }).
        error(function (data, status, headers, config) {
            header = {};
            //  $cordovaToast.showShortBottom("Unable to communicate with server... Please try again.");
            error(data, status, headers, config);
        });
    },
    this.updateMyProfile = function(profiledata, action){
        var user = firebase.auth().currentUser;
        var uid = user.uid;
        function updatePhoto(){
            console.log("Updating photoURL");
            firebase.database().ref('Members/' + uid + '/photoURL').set(profiledata.photoURL);
            user.updateProfile({
                photoURL: profiledata.photoURL
            }).then(function() {
                // Update successful.
            }).catch(function(error) {
                // An error happened.
                msgService.showError("Profile picture update failed " + error);
            });
        };
        function updateName(){
            console.log("Updating Name");
            firebase.database().ref('Members/' + uid).update({
                Name: profiledata.Name
            });
            firebase.database().ref('Members/' + uid).on('value',function(snap){
                if(snap.val()){
                    var path = 'Families/' + snap.val().Families.ID + '/FamilyMembers/' + uid + '/Name';
                    firebase.database().ref(path).set(profiledata.Name);
                }
            });
            user.updateProfile({
                displayName: profiledata.Name
            }).then(function() {
                // Update successful.
            }).catch(function(error) {
                // An error happened.
                msgService.showError("Name update failed " + error);
            });
            // Update name in FamilyMembers
            console.log(user);
        };
        function updateEmail(){
            console.log("Updating Email");
            user.updateEmail(profiledata.newEmail).then(function () {
                // Update successful.
                //msgService.showSuccess("Email has been updated");
            }).catch(function (error) {
                msgService.showError("Email update Failed " + error);
            });
        };
        function updatePassword(){
            console.log("Updating password");
            var credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                profiledata.oldPassword
            );
            user.reauthenticateWithCredential(credential).then(function() {
                // If old password is a match
                user.updatePassword(profiledata.newPassword).then(function () {
                    // Update successful.
                    //msgService.showSuccess("Password has been updated");
                }).catch(function (error) {
                    msgService.showError("Password update Failed " + error);
                });

            }).catch(function(error) {
                //Old password was not a match
                msgService.showError("Your old password was invalid. " + error);
            });
        };
        switch (action) {
            case 'photo':
                updatePhoto();
                break;
            case 'name':
                updateName();
                break;
            case 'email':
                updateEmail();
                break;
            case 'password':
                updatePassword();
                break;
            default:
                msgService.showError("There was an unexpected error: " + error);
        }
    },

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
                family.reverse();
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
                    photoURL: "https://firebasestorage.googleapis.com/v0/b/familytasksmanager.appspot.com/o/default_user_icon.png?alt=media&token=813a45a9-ee2c-47c6-9096-2d51f27638ef",
                    hasLogged: hasLogged,
                    Families: {ID: famRoomID, Notifications: true}
                });

                memberInfo.updateProfile({
                    displayName: family[0].name,
                    photoURL: "https://firebasestorage.googleapis.com/v0/b/familytasksmanager.appspot.com/o/default_user_icon.png?alt=media&token=813a45a9-ee2c-47c6-9096-2d51f27638ef"
                }).then(function() {
                    if(family[0].Role == 'Owner'){
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
                    member.photoURL     = snap.val().photoURL;
                    member.email        = userInfo.email;
                    member.Families     = snap.val().Families;
                    firebase.database().ref('Families/'+member.Families.ID).on('value',function(childSnap){
                        if(childSnap.val()){
                            member.Family = childSnap.val();
                            member.Points = member.Family.FamilyMembers[member.uid].Points;
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
                        member.email        = userInfo.email;
                        member.photoURL     = snap.val().photoURL;
                        member.Families     = snap.val().Families;
                        firebase.database().ref('Families/'+member.Families.ID).on('value',function(childSnap){
                            if(childSnap.val()){
                                member.Family = childSnap.val();
                                member.Points = member.Family.FamilyMembers[member.uid].Points;
                                $ionicLoading.hide();
                                console.log(member);
                                $rootScope.$broadcast('member-updated', { info: member });
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
                $state.go('login');
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
            logged = false;
            member = {};
            ownerPassed = false;
  			$state.go('login');
		}, function(error) {
			msgService.showError("An error occurred while logging out");
		});
    }
    return this;
});
