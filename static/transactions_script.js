// jquery
$(document).ready(function () {

  var allCategories = [];
  var allLabels = [];

  function fetchCategories() {
    $.ajax({
      type: "GET",
      url: "/get_categories",
      success: function (data) {
        allCategories = data.categories;
        console.log(allCategories);
      },
    });
  }
  
  function fetchLabels() {
    $.ajax({
      type: "GET",
      url: "/get_labels",
      success: function (data) {
        allLabels = data.labels;
      },
    });
  }

  // variables and flags
  var update_transaction = [false, ''];

  // at_a_glance variable
  let at_a_glance;

  // Toggle expand button
  $(".add_transaction_expanded").click(function () {

    // if background color is lightcoral, clear all input fields
    if ($(".add_transaction_expanded").hasClass("color_change")) {

      // add delay of 0.5s
      setTimeout(function () {
        // clear all input fields
        clear_input_fields();
        // change text of #add_transaction button to Add Transaction
        $("#add_transaction").text("Add Transaction");
        // change color of #add_transaction button
        $("#add_transaction").css("background-color", "#dd7dff");
      }, 500);
    }

    // rotate the span
    $(".add_transaction_expanded span").toggleClass("rotate");
    $(".add_transaction").toggleClass("expanded");
    $(".add_transaction_container").toggleClass("visible");
    $(".add_transaction_expanded").toggleClass("color_change");
    // change the background color of the add transaction button after 0.5s
    setTimeout(function () {
      $(".add_transaction").toggleClass("background_color_change");
    }, 350);
  });

  // Clicking on a transaction card
  $(document).on("click", ".transaction_card .card", function () {
    // get the parent element
    var parent = $(this).parent();
    $(parent).find(".extra_info div").fadeToggle(500);
    $(parent).find(".extra_info").slideToggle(500);
    $(parent).find(".edit_buttons").slideToggle(300);
    $(parent).find(".edit_buttons div").fadeToggle(300);

    // blur all other
    // $(".transaction_card").not(parent).toggleClass("blur");
    // $("header").toggleClass("blur");

    // // blur h1 and add transaction button
    // $(".add_transaction_expanded").toggleClass("blur");
    // $("#transactions_container h1").toggleClass("blur");

    // transform the scale of the parent
    $(parent).toggleClass("scale");
  });

  // go to settings page
  $("#settings").click(function () {
    //go to settings page
    window.location.href = "/settings";
  });

  // function to get date from backend and update the input field
  function get_date() {
    $.ajax({
      type: "GET",
      url: "/get_date",
      success: function (data) {
        $("#date").val(data.date);
      },
    });
  }

  // function to clear all input fields
  function clear_input_fields() {
    $("#payment").val("");
    $("#value").val("");
    // set first option as selected
    $("#category").val($("#category option:first").val());
    $("#comments").val("");
    // loop through labels and remove the checked ones
    $(".label").each(function () {
      if ($(this).hasClass("label_selected")) {
        $(this).removeClass("label_selected");
      }
    });
  }

  // function null_check
  function null_check(value) {
    if (value == null) {
      return "";
    } else {
      return value;
    }
  }

  // Add transaction
  // clicking labels span changes color (toggle)
  $(".label").click(function () {
    $(this).toggleClass("label_selected");
  });

  // Add or update a transaction to database
  $("#add_transaction").click(function () {
    // get all the values from the input fields
    var payment = $("#payment").val();
    var value = $("#value").val();
    // Find the selected category by its name and get its ID
  var selectedCategoryName = $("#category").val();
  var category = allCategories.find((cat) => cat.name === selectedCategoryName).id
    var comments = $("#comments").val();
    var date = $("#date").val();
    var labels = [];
    // loop through labels and get the checked ones
    $(".label").each(function () {
      if ($(this).hasClass("label_selected")) {
        var labelName = $(this).text();
        console.log(labelName);
        console.log(allLabels);
        var labelId = allLabels.find((lbl) => lbl.name === labelName).id;
        labels.push(labelId);
      }
    });
    if (update_transaction[0] == true) {
      // check if all fields are filled
      if (payment == "" || value == "" || category == "null" || date == "") {
        // display error message via alert
        alert("Please fill all the fields");
      } else {
        // send data to backend
        $.ajax({
          type: "POST",
          url: "/update_transaction",
          contentType: "application/json",
          data: JSON.stringify({
            id: update_transaction[1],
            payment: payment,
            // convert value to float
            value: parseFloat(value),
            category: category,
            comments: comments,
            date: date,
            labels: labels,
          }),
          success: function () {
            // clear all input fields
            clear_input_fields();
            // get date from backend and update the input field
            get_date();
            // reload all
            reload_all();
            // update update_transaction flag and id
            update_transaction = [false, ''];
            // click the expand button to close the add transaction container
            $(".add_transaction_expanded").click();
          },
          error: function (error) {
            console.log("error:", error);
          },
        });
      }
    }
    else {
      // check if all fields are filled
      if (payment == "" || value == "" || category == "null" || date == "") {
        // display error message via alert
        alert("Please fill all the fields");
      } else {
        // send data to backend
        $.ajax({
          type: "POST",
          url: "/add_transaction",
          contentType: "application/json",
          data: JSON.stringify({
            payment: payment,
            // convert value to float
            value: parseFloat(value),
            category: category,
            comments: comments,
            date: date,
            labels: labels,
          }),
          success: function () {
            // clear all input fields
            clear_input_fields();
            // get date from backend and update the input field
            get_date();
            // reload all
            reload_all();
            // click the expand button to close the add transaction container
            $(".add_transaction_expanded").click();
          },
          error: function (error) {
            console.log("error:", error);
          },
        });
      }
    }
  });

  // Reload Transactions function
  // get transactions from backend and display them
  function reload_transactions() {
    // get transactions from backend
    $.ajax({
      type: "GET",
      url: "/get_transactions",
      success: function (data) {
        // clear the transactions container
        $("#inner_transactions_container").html("");
        // loop through transactions
        for (var i = 0; i < data.transactions.length; i++) {
          // get the transaction
          var transaction = data.transactions[i];
          // null check comments
          var comments = null_check(transaction.comments);
          // get the labels
          var labels = null_check(transaction.labels);

          // create the labels html
          var labels_html = labels
            .map((label) => {
              return label ? `<span class="label">${label}</span>` : "";
            })
            .join("");

          // create the transaction html
          var transaction_html = `
            <div class="transaction_card" data-category='${transaction.category}'>
              <div class="card">
                <div class="row">
                   <div class="col cat_img">
            <img src="static/images/${
              transaction.category
            }.png" alt="" onerror="this.onerror=null; this.src='static/images/Other.png';">
          </div>
          <div class="col cat_pay">
                <div class="row payment">${transaction.payment}</div>
                <div class="row category">${transaction.category}</div>
          </div>
                  <div class="col date_val">
                        <div class="row value">$${transaction.value}</div>
                        <div class="row date">${transaction.date.slice(
                          5,
                          16
                        )}</div>
                  </div>
                </div>
              <div class="row">
                    <div class="col extra_info"  style="display: none;">
                        <div class="extra_info_labels"  style="display: none;">
                            <b>Labels:</b>${
                              labels.length == 0 ? " No labels" : labels_html
                            }
                        </div>
                        <div class="extra_info_comment"  style="display: none;">
                            <i><b>Comment:</b></i>
                            <p class="comment">${
                              comments == ""
                                ? "No comment"
                                : comments
                            }</p>
                        </div>
                    </div>
              </div>
            </div>
            <div class="edit_buttons" style="display: none;" data-id="${
              transaction.id
            }">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
            </div>
        </div>  
          `;
          // append the transaction html to the transactions container
          $("#inner_transactions_container").append(transaction_html);
        }
        get_date();
      },
    });
  }

  // Reload Budgeting function
  // get budgeting data from backend and display them
  function reload_budgeting() {
    // TODO: get budgeting data from backend
    $.ajax({
      type: "GET",
      url: "/get_budgeting",
      success: function (data) {
        green = "#6afa6a";
        orange = "orange";
        red = "#ff0000";
        // find the total budget
        var total_budget = 0;
        for (var i = 0; i < Object.keys(data).length; i++) {
          total_budget += data[Object.keys(data)[i]].budget;
        }
        // find the total spent
        var total_spent = 0;
        for (var i = 0; i < Object.keys(data).length; i++) {
          total_spent += data[Object.keys(data)[i]].sum;
        }
        header_html = `<h4 style="margin:20px 10px;display:flex; justify-content:space-between;"><span>Budget: $${total_budget.toFixed(2)} </span> <span>Spent: $${total_spent.toFixed(2)}</span></h4>`;
        // clear the budgeting container
        $("#budgeting_container").html(header_html);
        // $("#budgeting_container").html("<h1>Budgeting</h1>");
        // loop through budgeting data
        for (var i = 0; i < Object.keys(data).length; i++) {
          // get the budgeting data
          var budgeting = Object.keys(data)[i];
          // create the budgeting html
          var budgeting_html = `
            <div class="budgeting_card">
              <div class="card">
                  <div class="row">
                      <div class="col cat_img">
                      <img src="static/images/${budgeting}.png" alt="" onerror="this.onerror=null; this.src='static/images/Other.png';">
                      </div>
                      <div class="col cat_bud">
                          <div class="row category">${budgeting}</div>
                          <div class="row bar">
                            <div class="outer-bar">
                              <div class="inner-bar" style="background-color: ${
                                data[budgeting].percentage < 70 ? green : data[budgeting].percentage < 90 ? orange : red
                               }; 
                              width: ${ 
                                // if the percentage is greater than 100, set it to 100
                                data[budgeting].percentage > 100 ? 100 : data[budgeting].percentage
                              }%; height: 100%;"></div>
                            </div>
                            <p>$${data[budgeting].budget}</p>
                          </div>
                      <div class="row remaining">$${
                        // if the difference is negative, make it positive and change remaining to overbudget
                        // round the difference to 2 decimal places
                        data[budgeting].difference < 0 ? Math.round(-data[budgeting].difference * 100) / 100 + ' overbudget' : Math.round(data[budgeting].difference * 100) / 100 + ' remaining'
                      }</div>
                    </div>
                  </div>
              </div>
            </div>

          `;
          // append the budgeting html to the budgeting container
          $("#budgeting_container").append(budgeting_html);
        }
      },
    });
  }

  // Categories for filter
  function filter_categories() {
    $("#filter_options .options").html("");
    $.ajax({
      type: "GET",
      url: "/get_categories",
      success: function (data) {
        for (var i = 0; i < data.categories.length; i++) {
          var category = data.categories[i];
          // have a check box for each category
          var category_html = `
            <div class="filter-category">
              <input type="checkbox" id="${'filter-'+category}" name="${category}" value="${category}" checked>
              <label for="${'filter-'+category}">${category}</label>
            </div>
          `;
          // append the category html to the filter options
          $("#filter_options .options").append(category_html);
        }
      },
    });
  }

  // clicking oo filter_container class will show the filter options
  $(".filter_container").click(function () {
    // transition the filter options
    $("#filter_options").slideToggle(200);
  });

  // toggle_all function
  $("#toggle_all").click(function () {
    // if the toggle all button is checked
    if ($(this).is(":checked")) {
      // check all the checkboxes
      $(".filter-category input").each(function () {
        $(this).prop("checked", false);
      });
    }
    else {
      // if the toggle all button is not checked
      // uncheck all the checkboxes
      $(".filter-category input").each(function () {
        $(this).prop("checked", true);
      });
    }
    // trigger the change event for the checkboxes
    $(".filter-category input").trigger("change");
  });

  // if checkbox is checked, show the transactions with that category
  $(document).on("change", ".filter-category input", function () {
    // get the category
    var category = $(this).val();
    // if the checkbox is checked
    if ($(this).is(":checked")) {
      // class transaction_card with data-category equal to the category
      $('.transaction_card').each(function() {
        if ($(this).data('category') == category) {
          $(this).show();
        }
      });
    } else {
      // if the checkbox is not checked
      $('.transaction_card').each(function() {
        if ($(this).data('category') == category) {
          $(this).hide();
        }
      });
    }
  });

  // on clicking delete button
  $(document).on("click", ".delete", function () {
    if (confirm("Are you sure you want to delete this transaction?")) {
      // get the id of the transaction
      var id = $(this).parent().data("id");
      // send the id to backend
      $.ajax({
        type: "POST",
        url: "/delete_transaction",
        contentType: "application/json",
        data: JSON.stringify({
          id: id,
        }),
        success: function () {
          // reload all
          reload_all();
        },
        error: function (error) {
          console.log("error:", error);
        },
      });
    } else {
      return;
    }
  });

  // on clicking edit button
  $(document).on("click", ".edit", function () {
    parent = $(this).parent().parent();
    // click the expand button to open the add transaction container
    $(".add_transaction_expanded").click();
    // add #payment to the input field
    $("#payment").val(parent.find(".payment").text());
    // add #value to the input field, convert to float and slice the $ sign
    $("#value").val(parseFloat(parent.find(".value").text().slice(1)));
    // select #category from the dropdown
    $("#category").val(parent.find(".category").text());
    // add #comments to the input field
    $("#comments").val(parent.find(".comment").text());
    // add #date to the input field
    // convert to date format
    var date = new Date(parent.find(".date").text());
    var date_string = date.toISOString().slice(0, 10);
    $("#date").val(date_string);
    // change background color of selected .labels .label to class label_selected
    var labels = parent.find(".extra_info_labels .label");
    for (var i = 0; i < labels.length; i++) {
      // toggle the class label_selected
      $(`.labels .label:contains(${labels[i].innerText})`).toggleClass(
        "label_selected"
      );
    }
    // get the id of the transaction
    var id = $(this).parent().data("id");

    // update the update_transaction variable
    update_transaction[0] = true;
    update_transaction[1] = id;

    // change #add_transaction button text to Save Changes
    $("#add_transaction").text("Save Changes");
    // change #add_transaction button color to lightgreen
    $("#add_transaction").css("background-color", "lightgreen");
  });

  // Chart.js
  // get a mixed line chart of the transactions,
  // where x-axis is the date and y-axis is the value
  // get the data from the backend
  function main_chart(){
    $.ajax({
      url: "/main_chart",
      type: "POST",
      success: function (d) {
        at_a_glance = new Chart(document.getElementById("main_chart"), {
          data : {
            datasets: create_chart_datasets(d['transactions']),
          },
          options: {
            plugins:{
              zoom: {
                pan:{
                  enabled: true,
                  mode: 'xy',
                },
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true
                  },
                  mode: 'x  ',
                }
              }
            },
            scales: {
              x: {
                type: 'linear',
                min: 1,
                max: 31,
                ticks: {
                    stepSize: 3
                }
              }
            }
          }
        }); 
      },
      error: function (error) {
        console.log("error:", error);
      },
    });
  }

  // reset chart to default on clicking reset_chart ID button
  $("#reset_chart").click(function(){
    at_a_glance.resetZoom();
  });

  // get the data for the chart
  function create_chart_datasets(data) {
    arr = [];
    for (var i = 0; i < Object.keys(data).length; i++) {
      var obj = {
        type: "line",
        label: date_format_ym(Object.keys(data)[i]),
        data: data[Object.keys(data)[i]],
        lineTension: 0.5,
      };
      arr.push(obj);
    }
    return arr;
  }

  // change from YYYY-MM to month year, eg: 2021-01 to Jan 2021
  function date_format_ym(date) {
    months = [
      "Jan",  "Feb",  "Mar",  "Apr",  "May",  "Jun",
      "Jul",  "Aug",  "Sep",  "Oct",  "Nov",  "Dec"
    ];
    var year = date.slice(0, 4);
    var month = date.slice(5, 7);
    return months[parseInt(month) - 1] + " " + year;
  }

  // resize the canvas when the window is resized
  function resizeCanvas() {
    var canvas = document.querySelector('#main_chart');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }

  // stats page
  // on clicking #stats button
  $("#stats").click(function () {
    // move to stats page
    $.ajax({
      url: "/stats",
      type: "POST",
      complete: function () {
        window.location.href = "/stats";
      },
      error: function () {
        console.log("error");
      },
    });
  });

  // toggle between transaction container and budgeting container
  $(".transaction_budget_toggle_wrapper h2:first-child").click(function () {
    if ($(".transaction_budget_toggle_wrapper h2:first-child").hasClass("transaction_budget_toggle")) {}
    else{
      $(".transaction_budget_toggle_wrapper h2:first-child").addClass("transaction_budget_toggle");
      $(".transaction_budget_toggle_wrapper h2:last-child").removeClass("transaction_budget_toggle");
      $("#budgeting_container").css("display", "block");
      $("#transactions_container").css("display", "none");
    }
  });
  
  $(".transaction_budget_toggle_wrapper h2:last-child").click(function () {
    if ($(".transaction_budget_toggle_wrapper h2:last-child").hasClass("transaction_budget_toggle")) {}
    else{
      $(".transaction_budget_toggle_wrapper h2:last-child").addClass("transaction_budget_toggle");
      $(".transaction_budget_toggle_wrapper h2:first-child").removeClass("transaction_budget_toggle");
      $("#budgeting_container").css("display", "none");
      $("#transactions_container").css("display", "block");
    }
  });

  function reload_all(){
    // run all the functions
    reload_budgeting();
    reload_transactions();
    filter_categories();
    main_chart();
  }  

  window.addEventListener('resize', resizeCanvas);
  fetchCategories();
  fetchLabels();
  reload_budgeting();
  reload_transactions();
  filter_categories();
  main_chart();
});
