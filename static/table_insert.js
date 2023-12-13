$(document).ready(function () {
    labels = [];
    categories = [];

    // Get labels from backend
    async function getLabels() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "GET",
                url: "/get_labels",
                success: function (data) {
                    labels = data.labels;
                    resolve();
                },
                error: function (error) {
                    console.log("error:", error);
                    reject(error);
                },
            });
        });
    }

    // Get categories from backend
    async function getCategories() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "GET",
                url: "/get_categories",
                success: function (data) {
                    categories = data.categories;
                    console.log("categories:", categories);
                    resolve();
                },
                error: function (error) {
                    console.log("error:", error);
                    reject(error);
                },
            });
        });
    }


    // Generate label elements
    function generateLabelElements() {
        return labels
            .map(function (label) {
                return (
                    '<span class="label" data-label="' +
                    label['id'] +
                    '">' +
                    label['name'] +
                    "</span>"
                );
            })
            .join("");
    }

      // Generate category options
      function generateCategoryOptions() {
        return categories
            .map(function (category) {
                return (
                    '<option value="' +  category['id'] + '">' + category['name'] + "</option>"
                );
            })
            .join("");
    }

    // Add row function
    function addRow() {
        var table = document.getElementById("transactions_table");
        var row = table.insertRow(1);
        var dateCell = row.insertCell(0);
        var paymentToCell = row.insertCell(1);
        var valueCell = row.insertCell(2);
        var categoryCell = row.insertCell(3);
        var labelsCell = row.insertCell(4);
        var commentsCell = row.insertCell(5);
        var deleteCell = row.insertCell(6);

        dateCell.innerHTML = '<input type="date" name="date" class="date">';
        paymentToCell.innerHTML =
            '<input type="text" name="payment_to" class="payment_to">';
        valueCell.innerHTML = '<input type="text" name="value" class="value">';
        categoryCell.innerHTML =
            '<select name="category" class="category">' +
            generateCategoryOptions() +
            "</select>";
        labelsCell.innerHTML =
            '<div name="labels" class="col labels">' +
            generateLabelElements() +
            "</div>";
        commentsCell.innerHTML =
            '<textarea name="comments" class="comments" cols="30" rows="5"></textarea>';
        deleteCell.innerHTML = '<button class="delete_row">Delete</button>';
    }

    // Add event listener to table for click events
    document
        .getElementById("transactions_table")
        .addEventListener("click", function (event) {
            // Check if clicked element is a delete button
            if (event.target.classList.contains("delete_row")) {
                // Get the row containing the clicked button and delete it
                var row = event.target.parentNode.parentNode;
                row.parentNode.removeChild(row);
            }
        });

    // Add row when Add Row button is clicked
    document.getElementById("add_row").addEventListener("click", function () {
        addRow();
    });

    // Toggle label class when clicked
    $("body").on("click", ".label", function () {
        $(this).toggleClass("label_selected");
    });

    // Add multiple transactions from table
    $("#insert_data").click(function () {
        // get all the rows from the table
        var rows = $("#transactions_table tr:not(:first-child)");
    
        // create an array to store the transactions
        var transactions = [];
    
        // loop through each row and get the values from the input fields
        var error_rows = [];
        rows.each(function (index) {
            var payment = $(this).find("input[name='payment_to']").val();
            var value = $(this).find("input[name='value']").val();
            var category = $(this).find("select[name='category']").val();
            var date = $(this).find("input[name='date']").val();
    
            // check if any required fields are missing
            if (
                payment === "" ||
                value === "" ||
                category === "null" ||
                date === ""
            ) {
                // add the index of the error row to the error_rows array
                error_rows.push(index + 1);
            } else {
                var comments = $(this).find("textarea[name='comments']").val();
    
                // Initialize the labels variable as an empty string
                var labels = "";
    
                // Iterate through the labels with the class 'label_selected'
                $(this).find(".label.label_selected").each(function () {
                    // Append the label's text with a comma and space in between
                    labels += (labels ? ", " : "") + $(this).text();
                });
    
                // create a new transaction object and add it to the array
                var transaction = {
                    payment: payment,
                    value: parseFloat(value),
                    category: category,
                    comments: comments,
                    date: date,
                    labels: labels,
                };
    
                transactions.push(transaction);
            }
        });
    
        if (error_rows.length > 0) {
            // display error message via alert
            var error_message =
                "Please fill all the required fields for rows: " +
                error_rows.join(", ") +
                " or delete them.";
            alert(error_message);
        } else {
            // send data to backend
            console.log("transactions:", transactions);
            $.ajax({
                type: "POST",
                url: "/add_transactions_table",
                contentType: "application/json",
                data: JSON.stringify(transactions),
                success: function () {
                    // reload the page
                    location.reload();
                    window.alert("Transactions added successfully!");
                },
                error: function (error) {
                    console.log("error:", error);
                },
            });
        }
    });
    

    // add 4 rows when page loads
    (async function () {
        try {
            await getCategories();
            await getLabels();
    
            for (var i = 0; i < 4; i++) {
                addRow();
            }
        } catch (error) {
            console.log("Error initializing:", error);
        }
    })();
    

});
