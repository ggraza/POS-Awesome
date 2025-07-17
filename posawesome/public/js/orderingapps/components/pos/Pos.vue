<template>
  <div fluid class="mt-2">
    <ClosingDialog></ClosingDialog>
    <SalesOrders></SalesOrders>
    <Returns></Returns>
    <NewAddress></NewAddress>
    <Variants></Variants>
    <OpeningDialog v-if="dialog" :dialog="dialog"></OpeningDialog>
    <v-row v-show="!dialog">
      <v-col
        v-show="!payment && !offers && !coupons"
        xl="5"
        lg="5"
        md="5"
        sm="5"
        cols="12"
        class="pos pr-0"
      >
        <ItemsSelector></ItemsSelector>
      </v-col>
      <v-col
        v-show="payment"
        xl="5"
        lg="5"
        md="5"
        sm="5"
        cols="12"
        class="pos pr-0"
      >
        <Payments></Payments>
      </v-col>
      <v-col xl="7" lg="7" md="7" sm="7" cols="12" class="pos">
        <Invoice></Invoice>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { evntBus } from '../../bus';
import ItemsSelector from './ItemsSelector.vue';
import Invoice from './Invoice.vue';
import OpeningDialog from './OpeningDialog.vue';
import Payments from './Payments.vue';
import SalesOrders from './SalesOrders.vue';
import ClosingDialog from './ClosingDialog.vue';
import NewAddress from './NewAddress.vue';
import Variants from './Variants.vue';
import Returns from './Returns.vue';

export default {
  data: function () {
    return {
      dialog: false,
      pos_profile: '',
      payment: false,
    };
  },

  components: {
    ItemsSelector,
    Invoice,
    OpeningDialog,
    Payments,
    ClosingDialog,

    Returns,
    NewAddress,
    Variants,
    SalesOrders,
  },

  methods: {
check_opening_entry() {
  return frappe
    .call('posawesome.posawesome.api.posapp.check_opening_shift', {
      user: frappe.session.user,
    })
    .then((r) => {
      if (r.message) {
        this.pos_profile = r.message.pos_profile;
        evntBus.$emit('register_pos_profile', r.message);
        evntBus.$emit('set_company', r.message.company);
        console.info('LoadPosProfile');
      } else {
        this.dialog = true; // show OpeningDialog
      }
    });
},
    fetch_pos_profile() {
      return frappe
        .call('posawesome.posawesome.api.posapp.get_pos_profile', {
          user: frappe.session.user,
        })
        .then((r) => {
          if (r.message) {
            this.pos_profile = r.message.pos_profile;
            evntBus.$emit('register_pos_profile', r.message);
            evntBus.$emit('set_company', r.message.company);
            this.get_offers(this.pos_profile.name);
            console.info('LoadPosProfile');
          } else {
            frappe.msgprint({
              title: __('Error'),
              indicator: 'red',
              message: __('No POS Profile found for the user.'),
            });
          }
        });
    },
    get_pos_setting() {
      frappe.db.get_doc('POS Settings', undefined).then((doc) => {
        evntBus.$emit('set_pos_settings', doc);
      });
    },
  },

  mounted: function () {
    this.$nextTick(function () {
      //this.fetch_pos_profile(); 
      evntBus.$on('close_opening_dialog', () => {
        this.dialog = false;
      });
      this.check_opening_entry(); // ? open dialog if no shift is open
      this.get_pos_setting();
      evntBus.$on('register_pos_data', (data) => {
        this.pos_profile = data.pos_profile;
        evntBus.$emit('register_pos_profile', data);
        console.info('LoadPosProfile');
      });
      evntBus.$on('show_payment', (data) => {
        this.payment = true ? data === 'true' : false;
      });
    });
  },
  beforeDestroy() {
    evntBus.$off('close_opening_dialog');
    evntBus.$off('register_pos_data');
    evntBus.$off('LoadPosProfile');
    evntBus.$off('show_invoices');
  },
};
</script>

<style scoped></style>
