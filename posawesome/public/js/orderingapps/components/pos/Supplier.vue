<template>
  <div>
    <v-autocomplete
      ref="supplierField"
      dense
      clearable
      auto-select-first
      outlined
      color="primary"
      :label="frappe._('Supplier')"
      v-model="supplier"
      :items="suppliers"
      item-text="supplier_name"
      item-value="name"
      background-color="white"
      :no-data-text="__('Supplier not found')"
      hide-details
      :filter="customFilter"
      :disabled="readonly"
    >
      <template v-slot:item="data">
        <template>
          <v-list-item-content>
            <v-list-item-title
              class="primary--text subtitle-1"
              v-html="data.item.supplier_name"
            ></v-list-item-title>
            <v-list-item-subtitle
              v-if="data.item.supplier_name != data.item.name"
              v-html="`ID: ${data.item.name}`"
            ></v-list-item-subtitle>
            <v-list-item-subtitle
              v-if="data.item.tax_id"
              v-html="`TAX ID: ${data.item.tax_id}`"
            ></v-list-item-subtitle>
            <v-list-item-subtitle
              v-if="data.item.email_id"
              v-html="`Email: ${data.item.email_id}`"
            ></v-list-item-subtitle>
            <v-list-item-subtitle
              v-if="data.item.mobile_no"
              v-html="`Mobile No: ${data.item.mobile_no}`"
            ></v-list-item-subtitle>
            <v-list-item-subtitle
              v-if="data.item.primary_address"
              v-html="`Primary Address: ${data.item.primary_address}`"
            ></v-list-item-subtitle>
          </v-list-item-content>
        </template>
      </template>
    </v-autocomplete>
  </div>
</template>

<script>
import { evntBus } from '../../bus';

export default {
  data: () => ({
    pos_profile: '',
    suppliers: [],
    selectedSupplier: null,
    supplier: '',
    readonly: false,
    supplier_info: {},
  }),

  methods: {
    supplier_blur() {
      this.$refs.supplierField.blur();
    },
    shortSupplier(e) {
      if (e.key === "s" || e.key === "S" && e.altKey) {
        e.preventDefault();
        if (this.$root) {
          this.$root.$emit('inputBlurTriggered');
        }
        this.$refs.supplierField.focus();
      }
    },
    get_supplier_names() {
      const vm = this;
      if (this.suppliers.length > 0) {
        return;
      }
      if (vm.pos_profile.posa_local_storage && localStorage.supplier_storage) {
        vm.suppliers = JSON.parse(localStorage.getItem('supplier_storage'));
      }
      frappe.call({
        method: 'posawesome.posawesome.api.posapp.get_supplier_names',
        args: {
          pos_profile: this.pos_profile.pos_profile,
        },
        callback: function (r) {
          if (r.message) {
            vm.suppliers = r.message;
            console.info('loadSuppliers');
            if (vm.pos_profile.posa_local_storage) {
              localStorage.setItem('supplier_storage', '');
              localStorage.setItem(
                'supplier_storage',
                JSON.stringify(r.message)
              );
            }
          }
        },
      });
    },
    new_supplier() {
      evntBus.$emit('open_update_supplier', null);
    },
    edit_supplier() {
      evntBus.$emit('open_update_supplier', this.supplier_info);
    },
    customFilter(item, queryText, itemText) {
      const textOne = item.supplier_name
        ? item.supplier_name.toLowerCase()
        : '';
      const textTwo = item.tax_id ? item.tax_id.toLowerCase() : '';
      const textThree = item.email_id ? item.email_id.toLowerCase() : '';
      const textFour = item.mobile_no ? item.mobile_no.toLowerCase() : '';
      const textFifth = item.name.toLowerCase();
      const searchText = queryText.toLowerCase();

      return (
        textOne.indexOf(searchText) > -1 ||
        textTwo.indexOf(searchText) > -1 ||
        textThree.indexOf(searchText) > -1 ||
        textFour.indexOf(searchText) > -1 ||
        textFifth.indexOf(searchText) > -1
      );
    },
  },

  computed: {},

  created: function () {
    this.$root.$on('supplierBlurTriggered', this.supplier_blur);
    document.addEventListener("keydown", this.shortSupplier.bind(this));
    this.$nextTick(function () {
      evntBus.$on('register_pos_profile', (pos_profile) => {
        this.pos_profile = pos_profile;
        this.get_supplier_names();
      });
      evntBus.$on('payments_register_pos_profile', (pos_profile) => {
        this.pos_profile = pos_profile;
        this.get_supplier_names();
      });
      evntBus.$on('set_supplier', (supplier) => {
        this.supplier = supplier;
      });
      evntBus.$on('add_supplier_to_list', (supplier) => {
        this.suppliers.push(supplier);
      });
      evntBus.$on('set_supplier_readonly', (value) => {
        this.readonly = value;
      });
      evntBus.$on('set_supplier_info_to_edit', (data) => {
        this.supplier_info = data;
      });
      evntBus.$on('fetch_supplier_details', () => {
        this.get_supplier_names();
      });
    });
  },
  destroyed() {
    document.removeEventListener("keydown", this.shortSupplier);
  },

  watch: {
    supplier(newValue) {
      if (newValue) {
        // The v-autocomplete field is filled
        if (this.$root) {
          this.$root.$emit('escEventTriggered');
        }
        this.$refs.supplierField.blur();
      }
      evntBus.$emit('update_supplier', this.supplier);
    },
  },
};
</script>
