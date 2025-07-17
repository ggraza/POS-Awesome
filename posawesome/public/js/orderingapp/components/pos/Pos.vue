<template>
  <v-container fluid>
    <v-card elevation="2" class="pa-4">
      <v-card-title class="primary--text">Create Sales Order</v-card-title>
      <v-card-text>
        <v-row>
          <!-- Company Selection -->
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="company"
              :items="companies"
              label="Company"
              outlined
              dense
              @change="fetchCustomers"
            ></v-autocomplete>
          </v-col>
          <!-- Customer Selection -->
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="customer"
              :items="customers"
              label="Customer"
              outlined
              dense
              @change="fetchPriceLists"
            ></v-autocomplete>
          </v-col>
          <!-- Price List Selection -->
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="price_list"
              :items="price_lists"
              label="Price List"
              outlined
              dense
            ></v-autocomplete>
          </v-col>
        </v-row>
        <v-row>
          <!-- Item Group Selection -->
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="item_group"
              :items="item_groups"
              label="Item Group"
              outlined
              dense
              @change="fetchItems"
            ></v-autocomplete>
          </v-col>
          <!-- Search Field -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search_value"
              label="Search Items"
              outlined
              dense
              append-icon="mdi-magnify"
              @input="fetchItems"
            ></v-text-field>
          </v-col>
        </v-row>
        <!-- Item Table -->
        <v-data-table
          :headers="item_headers"
          :items="items"
          item-key="item_code"
          class="elevation-1"
          :items-per-page="10"
        >
          <template v-slot:item.qty="{ item }">
            <v-text-field
              v-model.number="item.qty"
              type="number"
              min="0"
              dense
              single-line
              @input="updateItem(item)"
            ></v-text-field>
          </template>
          <template v-slot:item.amount="{ item }">
            {{ currencySymbol(currency) }} {{ formatCurrency(item.amount) }}
          </template>
        </v-data-table>
        <!-- Summary -->
        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <v-card flat>
              <v-card-text>
                <p><strong>Total Quantity:</strong> {{ total_qty }}</p>
                <p><strong>Total Amount (Before Tax):</strong> {{ currencySymbol(currency) }} {{ formatCurrency(total_amount) }}</p>
                <p><strong>Total Taxes:</strong> {{ currencySymbol(currency) }} {{ formatCurrency(total_taxes) }}</p>
                <p><strong>Grand Total:</strong> {{ currencySymbol(currency) }} {{ formatCurrency(grand_total) }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="clearForm">Clear</v-btn>
        <v-btn color="success" :disabled="is_loading || !items.length" @click="createSalesOrder">Create Sales Order</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import format from './format'; // Assuming format mixin exists in your project

export default {
  mixins: [format],
  data() {
    return {
      company: '',
      companies: [],
      customer: '',
      customers: [],
      price_list: '',
      price_lists: [],
      item_group: '',
      item_groups: [],
      search_value: '',
      items: [],
      currency: 'USD', Roslynned', // Default currency, updated later
      taxes: [],
      is_loading: false,
      item_headers: [
        { text: 'Item Code', value: 'item_code' },
        { text: 'Item Name', value: 'item_name' },
        { text: 'Stock UOM', value: 'stock_uom' },
        { text: 'Quantity', value: 'qty' },
        { text: 'Rate', value: 'rate' },
        { text: 'Amount', value: 'amount' },
      ],
    };
  },
  computed: {
    total_qty() {
      return this.items.reduce((sum, item) => sum + (item.qty || 0), 0);
    },
    total_amount() {
      return this.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    },
    total_taxes() {
      return this.taxes.reduce((sum, tax) => sum + (tax.tax_amount || 0), 0);
    },
    grand_total() {
      return this.total_amount + this.total_taxes;
    },
  },
  methods: {
    async fetchCompanies() {
      try {
        const r = await frappe.call({
          method: 'frappe.client.get_list',
          args: {
            doctype: 'Company',
            fields: ['name'],
          },
        });
        this.companies = r.message.map(c => c.name);
        if (this.companies.length) {
          this.company = this.companies[0];
          this.fetchCustomers();
        }
      } catch (error) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Failed to fetch companies.'),
        });
      }
    },
    async fetchCustomers() {
      if (!this.company) return;
      try {
        const r = await frappe.call({
          method: 'frappe.client.get_list',
          args: {
            doctype: 'Customer',
            filters: { disabled: 0 },
            fields: ['name', 'customer_name'],
          },
        });
        this.customers = r.message.map(c => ({ value: c.name, text: c.customer_name }));
        if (this.customers.length) {
          this.customer = this.customers[0].value;
          this.fetchPriceLists();
        }
      } catch (error) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Failed to fetch customers.'),
        });
      }
    },
    async fetchPriceLists() {
      if (!this.company || !this.customer) return;
      try {
        const r = await frappe.call({
          method: 'frappe.client.get_list',
          args: {
            doctype: 'Price List',
            filters: { selling: 1, enabled: 1 },
            fields: ['name'],
          },
        });
        this.price_lists = r.message.map(p => p.name);
        // Try to get customer-specific price list
        const customer_price_list = await frappe.call({
          method: 'frappe.client.get_value',
          args: {
            doctype: 'Customer',
            filters: { name: this.customer },
            fieldname: 'default_price_list',
          },
        });
        this.price_list = customer_price_list.message.default_price_list || this.price_lists[0] || '';
      } catch (error) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Failed to fetch price lists.'),
        });
      }
    },
    async fetchItemGroups() {
      try {
        const r = await frappe.call({
          method: 'frappe.client.get_list',
          args: {
            doctype: 'Item Group',
            filters: { is_group: 0 },
            fields: ['name'],
          },
        });
        this.item_groups = ['All Item Groups', ...r.message.map(g => g.name)];
        this.item_group = 'All Item Groups';
        this.fetchItems();
      } catch (error) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Failed to fetch item groups.'),
        });
      }
    },
    async fetchItems() {
      if (!this.company || !this.price_list) return;
      try {
        const r = await frappe.call({
          method: 'erpnext.selling.page.point_of_sale.point_of_sale.get_items',
          args: {
            price_list: this.price_list,
            item_group: this.item_group === 'All Item Groups' ? '' : this.item_group,
            search_value: this.search_value,
            pos_profile: null, // Not using POS Profile
          },
        });
        this.items = r.message.map(item => ({
          ...item,
          qty: item.qty || 0,
          rate: item.price_list_rate || 0,
          amount: item.price_list_rate * (item.qty || 0),
        }));
      } catch (error) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Failed to fetch items.'),
        });
      }
    },
    async updateItem(item) {
      item.qty = Math.max(0, item.qty || 0);
      try {
        const r = await frappe.call({
          method: 'erpnext.selling.page.point_of_sale.point_of_sale.get_item_price',
          args: {
            item_code: item.item_code,
            price_list: this.price_list,
            qty: item.qty,
            customer: this.customer,
            company: this.company,
            transaction_type: 'selling',
          },
        });
        item.rate = r.message.price_list_rate || 0;
        item.amount = item.rate * item.qty;

        // Fetch taxes
        await this.fetchTaxes();
      } catch (error) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Failed to fetch item price.'),
        });
      }
    },
    async fetchTaxes() {
      if (!this.items.length || !this.customer || !this.company) return;
      try {
        const r = await frappe.call({
          method: 'erpnext.controllers.accounts_controller.get_taxes_and_charges',
          args: {
            doctype: 'Sales Order',
            company: this.company,
            customer: this.customer,
            items: this.items.map(item => ({
              item_code: item.item_code,
              qty: item.qty,
              rate: item.rate,
            })),
          },
        });
        this.taxes = r.message || [];
        this.currency = r.message?.currency || 'USD';
      } catch (error) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Failed to fetch taxes.'),
        });
      }
    },
    async createSalesOrder() {
      if (!this.company || !this.customer || !this.price_list || !this.items.length) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Please fill all required fields and add items.'),
        });
        return;
      }
      this.is_loading = true;
      try {
        const r = await frappe.call({
          method: 'frappe.client.insert',
          args: {
            doc: {
              doctype: 'Sales Order',
              company: this.company,
              customer: this.customer,
              selling_price_list: this.price_list,
              items: this.items.filter(item => item.qty > 0).map(item => ({
                item_code: item.item_code,
                qty: item.qty,
                rate: item.rate,
                warehouse: item.warehouse || '', // Fetched from POS Profile or Item defaults
              })),
              taxes: this.taxes,
            },
          },
        });
        frappe.msgprint({
          title: __('Success'),
          indicator: 'green',
          message: __('Sales Order {0} created successfully').format(r.message.name),
        });
        this.clearForm();
      } catch (error) {
        frappe.msgprint({
          title: __('Error'),
          indicator: 'red',
          message: __('Failed to create Sales Order.'),
        });
      } finally {
        this.is_loading = false;
      }
    },
    clearForm() {
      this.company = '';
      this.customer = '';
      this.price_list = '';
      this.item_group = 'All Item Groups';
      this.search_value = '';
      this.items = [];
      this.taxes = [];
      this.fetchCompanies();
    },
    currencySymbol(currency) {
      return frappe.get_doc('Currency', currency)?.symbol || currency;
    },
    formatCurrency(value) {
      return this.formtCurrency(value); // Assuming format mixin provides this
    },
  },
  created() {
    this.fetchCompanies();
    this.fetchItemGroups();
  },
};
</script>

<style scoped>
.v-data-table {
  margin-top: 16px;
}
</style>