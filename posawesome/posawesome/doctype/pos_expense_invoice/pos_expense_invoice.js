// Copyright (c) 2024, Youssef Restom and contributors
// For license information, please see license.txt

frappe.ui.form.on('POS Expense Invoice', {
	// refresh: function(frm) {

	// }
});

frappe.ui.form.on('POS Expense Invoice', {
    child_table_name_add: function(frm, cdt, cdn) {
        calculateTotals(frm);
        calculateAmount(frm, cdt, cdn);
    },
    child_table_name_remove: function(frm, cdt, cdn) {
        calculateTotals(frm);
        calculateAmount(frm, cdt, cdn);
    }
});

frappe.ui.form.on('POS Expense Item', {
    qty: function(frm, cdt, cdn) {
        calculateTotals(frm);
        calculateAmount(frm, cdt, cdn);
    },
    rate: function(frm, cdt, cdn) {
        calculateAmount(frm, cdt, cdn);
        calculateTotals(frm);
    },
    amount: function(frm, cdt, cdn) {
        calculateTotals(frm);
        calculateAmount(frm, cdt, cdn);
    }
});

function calculateTotals(frm) {
    var totalQty = 0;
    var totalAmount = 0;
    
    // Iterate through each row in the child table
    var childTable = frm.doc.expense_detail || [];
    for (var i = 0; i < childTable.length; i++) {
        var row = childTable[i];
        
        // Add the quantity to the totalQty
        totalQty += flt(row.qty);
        
        // Add the amount to the totalAmount
        totalAmount += flt(row.amount);
    }
    
    // Set the calculated totals in the parent table fields
    frm.set_value('total_quantity', totalQty);
    frm.set_value('grand_total', totalAmount);
}

function calculateAmount(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    var amount = flt(d.qty) * flt(d.rate);
    frappe.model.set_value(cdt, cdn, 'amount', amount);
}
