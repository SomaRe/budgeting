// jquery

$(document).ready(function() {
    // when add_category button is clicked
    // add either one or more categories to the database
    $("#add_category").click(function() {
        var category = $("#category").val();
        var category_array = category.split(", ");
        $.ajax({
            type: "POST",
            url: "/settings/add_category",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(category_array),
            success: function(data) {
                // refresh the page
                location.reload();
            }
        });
    });


    // when delete_category button is clicked
    // delete the selected category from the database
    $(".category_delete").click(function() {
        var category = $(this).attr("data-category");
        $.ajax({
            type: "POST",
            url: "/settings/category_delete",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(category),
            success: function(data) {
                // refresh the page
                location.reload();
            }
        });
    });

    // add_label button is clicked
    // add either one or more labels to the database
    $("#add_label").click(function() {
        var label = $("#label").val();
        var label_array = label.split(", ");
        $.ajax({
            type: "POST",
            url: "/settings/add_label",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(label_array),
            success: function(data) {
                // refresh the page
                location.reload();
            }
        });
    });

    // when label_delete button is clicked
    // delete the selected label from the database
    $(".label_delete").click(function() {
        var label = $(this).attr("data-label");
        $.ajax({
            type: "POST",
            url: "/settings/label_delete",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(label),
            success: function(data) {
                // refresh the page
                location.reload();
            }
        });
    });

    // when add_budget button is clicked
    // add a budget to the database
    $("#add_budget").click(function() {
        // loop through add_budgets_container class and get the category from span tag
        // and the budget from input tag
        var budget = {};
        $(".add_budgets_container").each(function() {
            var category = $(this).find("span").text();
            var amount = parseFloat($(this).find("input").val());
            budget[category] = amount;
        });
        $.ajax({
            type: "POST",
            url: "/settings/add_budget",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(budget),
            success: function(data) {
                // refresh the page
                location.reload();
            }
        });
    });

     // double click on category name to edit it
    //  $(".category").dblclick(function() {
    //     console.log("double clicked");
    //     var category = $(this).text();
    //     $(this).html("<input type='text' class='category_edit' value='" + category + "'>");
    //     $(".category_edit").focus();
    //     // click outside the input box to save the new category name and change the element back to span
    //     $(".category_edit").blur(function() {
    //         console.log("blur");
    //         var new_category = $(this).val();
    //         $(this).parent().html(new_category);
    //     });

    // });


});