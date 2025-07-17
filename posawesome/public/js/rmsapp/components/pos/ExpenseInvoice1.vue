<template>
  <v-row justify="center">
    <v-dialog v-model="expenseDialog" max-width="800">
      <v-card>
        <v-card-title>
          <span class="headline primary--text">Create POS Expense Invoice</span>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-form ref="form" v-model="valid">
                  <!-- Company Field -->
                  <v-text-field
                    label="Company"
                    v-model="expenseInvoice.company"
                    :rules="[rules.required]"
                    required
                    readonly
                  ></v-text-field>

                  <!-- Date Field -->
                  <v-menu
                    ref="dateMenu"
                    v-model="dateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="expenseInvoice.date"
                        label="Date"
                        prepend-icon="mdi-calendar"
                        readonly
                        v-bind="attrs"
                        v-on="on"
                        required
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="expenseInvoice.date"
                      no-title
                      scrollable
                      color="primary"
                      :min="
                        frappe.datetime.add_days(frappe.datetime.now_date(true), -1)
                      "
                      :max="frappe.datetime.add_days(frappe.datetime.now_date(true), 7)"
                      @input="dateMenu = false"
                    ></v-date-picker>
                  </v-menu>

                  <!-- POS Opening Shift Field -->
                  <v-text-field
                    label="POS Opening Shift"
                    v-model="expenseInvoice.pos_opening_shift"
                    :rules="[rules.required]"
                    readonly
                    required
                  ></v-text-field>

                  <!-- Expense Detail Table -->
                  <v-simple-table>
                    <thead>
                      <tr>
                        <th>POS Expenses</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                        <th>Invoice No</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in expenseInvoice.expense_detail" :key="index">
                        <td>
                          <v-select
                            :items="posExpenseHeads"
                            v-model="item.pos_expenses"
                            label="POS Expense Head"
                            item-text="name"
                            item-value="name"
                          ></v-select>
                        </td>
                        <td>
                          <v-text-field
                            v-model="item.expense_description"
                            label="Description"
                          ></v-text-field>
                        </td>
                        <td>
                          <v-text-field
                            v-model="item.qty"
                            label="Qty"
                            type="number"
                            @input="updateAmount(item)"
                          ></v-text-field>
                        </td>
                        <td>
                          <v-text-field
                            v-model="item.rate"
                            label="Rate"
                            type="number"
                            @input="updateAmount(item)"
                          ></v-text-field>
                        </td>
                        <td>
                          <v-text-field
                            v-model="item.amount"
                            label="Amount"
                            type="number"
                            readonly
                          ></v-text-field>
                        </td>
                        <td>
                          <v-text-field
                            v-model="item.invoice_no"
                            label="Invoice No"
                          ></v-text-field>
                        </td>
                        <td>
                          <v-btn icon @click="removeExpenseRow(index)">
                            <v-icon color="red">mdi-delete</v-icon>
                          </v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </v-simple-table>

                  <!-- Add new row button -->
                  <v-btn color="warning" @click="addExpenseRow">Add Row</v-btn>

                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        label="Total QTY"
                        v-model="expenseInvoice.total_quantity"
                        readonly
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        label="Grand Total"
                        v-model="expenseInvoice.total_expense"
                        readonly
                      ></v-text-field>
                    </v-col>
                  </v-row>

                </v-form>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="submit">Submit</v-btn>
          <v-btn color="error" @click="expenseDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { evntBus } from '../../bus';
import format from '../../format';

export default {
  data() {
    return {
      expenseDialog: false,
      valid: true,
      dateMenu: false,
      expenseInvoice: {
        company: '',
        date: '',
        pos_opening_shift: '',
        expense_detail: [
          { pos_expenses: '', expense_description: '', qty: 1, amount: 0, invoice_no: '' },
        ],
      },
      posExpenseHeads: [], // Empty initially, will be populated from the server
      rules: {
        required: (value) => !!value || 'Required.',
      },
    };
  },
  methods: {
    addExpenseRow() {
      this.expenseInvoice.expense_detail.push({
        pos_expenses: '',
        expense_description: '',
        qty: 1,
        rate: 0,
        amount: 0,
        invoice_no: '',
      });
    },
    removeExpenseRow(index) {
      this.expenseInvoice.expense_detail.splice(index, 1);
    },
    submit() {
      if (this.$refs.form.validate()) {
        // Prepare the data to be sent
        const invoiceData = {
          doctype: "POS Expense Invoice",
          company: this.expenseInvoice.company,
          date: this.expenseInvoice.date,
          pos_opening_shift: this.expenseInvoice.pos_opening_shift,
          expense_detail: this.expenseInvoice.expense_detail.map(item => ({
            pos_expenses: item.pos_expenses,
            expense_description: item.expense_description,
            qty: item.qty,
            rate: item.rate,
            amount: item.amount,
            invoice_no: item.invoice_no,
          })),
          total_quantity: this.expenseInvoice.total_quantity,
          total_expense: this.expenseInvoice.total_expense,
        };
        // Call the Frappe API to create the new doctype
        frappe.call({
          method: "frappe.client.submit",
          args: { doc: invoiceData },
          callback: (response) => {
            if (response.message) {

              this.expenseDialog = false; // Close the dialog
              this.resetForm(); // Reset the form
              const invoice_name = response.message.name;
              //const invoice_name = this.expenseInvoice.name;
              this.load_print_page(invoice_name);
              // Optionally, show a success message or redirect
              evntBus.$emit("show_mesage", {
                text: `POS Expense Invoice  ${response.message.name} is created successfully!`,
                color: "success",
              });
            frappe.utils.play_sound("submit");
              // frappe.show_alert({ message: "POS Expense Invoice created successfully!", color: "success", duration: 5 });
            } else {
              frappe.msgprint("Failed to create POS Expense Invoice.");
            }
          },
          error: (error) => {
            console.error("Error creating invoice:", error);
            frappe.msgprint("An error occurred while creating the invoice. Please try again.");
          }
        });
      }
    },
    load_print_page(invoice_name) {
      const print_format = this.pos_profile.custom_expense_invoice_print_format;
      const letter_head = this.pos_profile.letter_head || 0; // Use letter head setting if available
      const encoded_invoice_name = encodeURIComponent(invoice_name);
      // Construct the URL for printing the expense invoice
      const url =
        frappe.urllib.get_base_url() +
        "/printview?doctype=POS Expense Invoice&name=" +
        encoded_invoice_name +
        "&trigger_print=1" +
        "&format=" +
        print_format +
        "&no_letterhead=" +
        letter_head;
    
      // Open a new window for printing
      const printWindow = window.open(url, "Print");
      printWindow.addEventListener(
        "load",
        function () {
          printWindow.print();
          // Uncomment the following line to close the print window automatically after printing
          // printWindow.close();
        },
        true
      );
    },
    resetForm() {
      this.expenseInvoice.expense_detail = [
        { pos_expenses: '', expense_description: '', qty: 1, rate: 0, amount: 0, invoice_no: '' },
      ];
  
      // Optionally, if you want to reset qty and amount when the dialog closes
      this.expenseInvoice.total_quantity = 0;  // Resetting total_quantity if needed
      this.expenseInvoice.total_expense = 0;     // Resetting total_expense if needed
    },
    fetchPOSExpenseHeads() {
      frappe.call({
        method: 'frappe.client.get_list',
        args: {
          doctype: 'POS Expense Head',
          fields: ['name'], // Fetch the required fields, here it's the 'name'
        },
        callback: (response) => {
          this.posExpenseHeads = response.message.map(item => item.name);
        },
      });
    },
    getTodayDate() {
      return frappe.datetime.now_date(); // Use frappe to get the current date
    },
    updateAmount(item) {
      item.amount = (item.qty || 0) * (item.rate || 0); // Ensure to handle null or undefined values
      //console.log(`Updated amount for item: ${item.amount}`); // Debugging log
      this.calculateExpenseTotal();
    },
    calculateExpenseTotal() {
      let totalAmount = 0;
      let totalQty = 0;

      // Calculate grand total and total quantity
      this.expenseInvoice.expense_detail.forEach((item) => {
        totalAmount += item.amount; // Sum of all amounts
        totalQty += item.qty ? parseFloat(item.qty) : 0;
      });

      // Update the expense invoice fields
      this.expenseInvoice.total_expense = totalAmount;
      this.expenseInvoice.total_quantity = totalQty;
      //console.log(`Total Amount: ${totalAmount}, Total Quantity: ${totalQty}`); // Debugging log
    },
  },
  created() {
    evntBus.$on('open_expense', (data) => {
      this.expenseDialog = true;
    });

    // Fetch the POS Expense Heads when the component is created
    this.fetchPOSExpenseHeads();
    
    this.expenseInvoice.date = this.getTodayDate();
    evntBus.$on("register_pos_profile", (data) => {
      this.pos_profile = data.pos_profile;
      this.pos_opening_shift = data.pos_opening_shift;

      // Set the company and POS opening shift in the expenseInvoice
      if (this.pos_profile) {
        this.expenseInvoice.company = this.pos_profile.company || '';
      }
      if (this.pos_opening_shift) {
        this.expenseInvoice.pos_opening_shift = this.pos_opening_shift.name || '';
      }

      this.expenseInvoice.date = this.getTodayDate(); // Set the current date
    });

  },
};
</script>

<style scoped>
.calc-btn {
  min-width: 60px;
}
</style>
