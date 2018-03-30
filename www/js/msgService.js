factory.factory('msgService', function (){
    this.showSuccess = function(msg) {
        swal("Success!", msg, "success");
    };
    this.showWarn = function(msg) {
        swal("Warning!", msg, "warning");
    };
    this.showError = function(msg) {
        swal("Error!", msg, "error");
    };
    this.showConfirm = function(fn){
        swal({
            title: "Are you sure?",
            text: "Your will not be able to recover this record!",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-danger",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: true
        }, fn);
    };
    this.showConfirmProfileDeletion = function(fn){
        swal({
            title: "Are you sure?",
            text: "All your information will be deleted!",
            type: "error",
            showCancelButton: true,
            confirmButtonClass: "btn-danger",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: true
        }, fn);
    };
    this.showSuccess = function(title, text){
        swal({
            title: title,
            text: text,
            type: "success",
            timer: 3000
        });
    };
    return this;
});
