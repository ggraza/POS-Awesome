<script type="text/javascript">
        var gk_isXlsx = false;
        var gk_xlsxFileLookup = {};
        var gk_fileData = {};
        function filledCell(cell) {
          return cell !== '' && cell != null;
        }
        function loadFileData(filename) {
        if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
            try {
                var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
                var firstSheetName = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[firstSheetName];

                // Convert sheet to JSON to filter blank rows
                var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
                // Filter out blank rows (rows where all cells are empty, null, or undefined)
                var filteredData = jsonData.filter(row => row.some(filledCell));

                // Heuristic to find the header row by ignoring rows with fewer filled cells than the next row
                var headerRowIndex = filteredData.findIndex((row, index) =>
                  row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
                );
                // Fallback
                if (headerRowIndex === -1 || headerRowIndex > 25) {
                  headerRowIndex = 0;
                }

                // Convert filtered JSON back to CSV
                var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex)); // Create a new sheet from filtered array of arrays
                csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
                return csv;
            } catch (e) {
                console.error(e);
                return "";
            }
        }
        return gk_fileData[filename] || "";
        }
        </script><template>
  <v-row justify="center">
    <v-dialog v-model="invoicesDialog" max-width="900px" min-width="800px" max-height="90vh">
      <v-card elevation="8" class="invoices-dialog-card">
        <!-- Header Section - White Background with Blue Text -->
        <v-card-title class="invoices-dialog-header">
          <div class="header-content">
            <div class="header-icon-wrapper">
              <v-icon class="header-icon">mdi-receipt</v-icon>
            </div>
            <div class="header-text">
              <h5 class="header-title">{{ __('Select Return Invoice') }}</h5>
              <p class="header-subtitle">{{ __('Choose an invoice for return processing') }}</p>
            </div>
          </div>
        </v-card-title>

        <!-- Content Section - Optimized for minimal scrolling -->
        <v-card-text class="invoices-dialog-content">
          <v-container class="pa-0">
            <v-row class="mb-4">
              <v-col cols="12" md="8" class="form-field">
                <v-text-field
                  color="primary"
                  :label="frappe._('Invoice ID')"
                  v-model="invoice_name"
                  dense
                  clearable
                  autofocus
                  variant="outlined"
                  prepend-inner-icon="mdi-magnify"
                  class="enhanced-field"
                  :class="{ 'field-focused': invoice_name }"
                  @keydown.enter="search_invoices"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn
                  class="pos-action-btn search-action-btn"
                  size="large"
                  elevation="2"
                  @click="search_invoices"
                >
                  <v-icon start>mdi-magnify</v-icon>
                  <span>{{ __('Search') }}</span>
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <div class="section-header-compact">
                  <h6 class="section-title-compact">
                    <v-icon class="section-icon">mdi-file-table</v-icon>
                    {{ __('Return Invoices') }}
                  </h6>
                </div>
                <v-data-table
                  ref="myDataTable2"
                  :headers="headers"
                  :items="dialog_data"
                  item-key="name"
                  class="enhanced-table-compact"
                  :single-select="singleSelect"
                  show-select
                  v-model="selected"
                  @click:row="onRowClick"
                  density="compact"
                  fixed-header
                >
                  <template v-slot:item.grand_total="{ item }">
                    <span class="currency-symbol">{{ currencySymbol(item.currency) }}</span>
                    <span class="amount-value">{{ formtCurrency(item.grand_total) }}</span>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <!-- Actions Section -->
        <v-card-actions class="dialog-actions-container">
          <v-btn
            theme="dark"
            @click="close_dialog"
            class="pos-action-btn cancel-action-btn"
            size="large"
            elevation="2"
          >
            <v-icon start>mdi-close-circle-outline</v-icon>
            <span>{{ __('Close') }}</span>
          </v-btn>
          <v-spacer />
          <v-btn
            theme="dark"
            @click="submit_dialog"
            class="pos-action-btn submit-action-btn"
            size="large"
            elevation="2"
            :disabled="selected.length === 0"
          >
            <v-icon start>mdi-check-circle-outline</v-icon>
            <span>{{ __('Select') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { evntBus } from '../../bus';
import format from '../../format';
export default {
  mixins: [format],
  data: () => ({
    invoicesDialog: false,
    singleSelect: true,
    selected: [],
    dialog_data: '',
    company: '',
    invoice_name: '',
    headers: [
      {
        text: __('Customer'),
        value: 'customer',
        align: 'start',
        sortable: true,
      },
      {
        text: __('Date'),
        align: 'start',
        sortable: true,
        value: 'posting_date',
      },
      {
        text: __('Invoice'),
        value: 'name',
        align: 'start',
        sortable: true,
      },
      {
        text: __('Amount'),
        value: 'grand_total',
        align: 'end',
        sortable: false,
      },
    ],
  }),
  watch: {
    dialog_data(new_value) {
      this.$nextTick(() => {
        const table = this.$refs.myDataTable2.$el;
        if (!table) return;
        const tableRows = table.querySelectorAll('tbody > tr');
        tableRows.forEach((row, index) => {
          row.setAttribute('tabindex', '0');
          row.addEventListener('keyup', (event) => {
            if (event.key === 'ArrowDown') {
              this.handleRowNavigation(event, index, tableRows, 'down');
            } else if (event.key === 'ArrowUp') {
              this.handleRowNavigation(event, index, tableRows, 'up');
            } else if (event.key === 'Enter') {
              this.handleEnterKeyPress(event, index, new_value);
            }
          });
        });
      });
    },
  },
  methods: {
    handleRowNavigation(event, index, tableRows, direction) {
      if (direction === 'down' && index < tableRows.length - 1) {
        tableRows[index + 1].focus();
      } else if (direction === 'up' && index > 0) {
        tableRows[index - 1].focus();
      }
    },
    handleEnterKeyPress(event, index, new_value) {
      const item = new_value[index];
      this.selected = [item];
      this.submit_dialog();
      if (this.$root) {
        this.$root.$emit('escEventTriggered');
      }
    },
    onRowClick(item) {
      this.selected = [item];
      this.submit_dialog();
      if (this.$root) {
        this.$root.$emit('escEventTriggered');
      }
    },
    close_dialog() {
      this.invoicesDialog = false;
      this.$root.$emit('escEventTriggered');
    },
    search_invoices() {
      const vm = this;
      frappe.call({
        method: 'posawesome.posawesome.api.posapp.search_invoices_for_return',
        args: {
          invoice_name: vm.invoice_name,
          company: vm.company,
        },
        async: false,
        callback: function (r) {
          if (r.message) {
            vm.dialog_data = r.message;
            vm.$nextTick(() => {
              const table = vm.$refs.myDataTable2.$el;
              if (!table) return;
              const firstRow = table.querySelector('tbody tr');
              if (firstRow) {
                setTimeout(() => {
                  firstRow.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                  firstRow.focus();
                }, 100);
              }
            });
          }
        },
      });
    },
    submit_dialog() {
      if (this.selected.length > 0) {
        const return_doc = this.selected[0];
        const invoice_doc = {};
        const items = [];
        return_doc.items.forEach((item) => {
          const new_item = { ...item };
          new_item.qty = item.qty * -1;
          new_item.stock_qty = item.stock_qty * -1;
          new_item.amount = item.amount * -1;
          items.push(new_item);
        });
        invoice_doc.items = items;
        invoice_doc.is_return = 1;
        invoice_doc.return_against = return_doc.name;
        invoice_doc.customer = return_doc.customer;
        const data = { invoice_doc, return_doc };
        evntBus.$emit('load_return_invoice', data);
        this.invoicesDialog = false;
      }
    },
  },
  created: function () {
    evntBus.$on('open_returns', (data) => {
      this.invoicesDialog = true;
      this.company = data;
      this.invoice_name = '';
      this.dialog_data = '';
      this.selected = [];
    });
  },
};
</script>

<style scoped>
/* Main Dialog Card */
.invoices-dialog-card {
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid rgba(25, 118, 210, 0.1);
  transition: all 0.3s ease;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* Header Section - White Background with Blue Text */
.invoices-dialog-header {
  background: white;
  color: #1976d2;
  padding: 16px 24px;
  border-bottom: 2px solid rgba(25, 118, 210, 0.1);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-wrapper {
  background: rgba(25, 118, 210, 0.1);
  border-radius: 50%;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.header-icon {
  font-size: 20px;
  color: #1976d2;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
  color: #1976d2;
}

.header-subtitle {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 2px 0 0 0;
  line-height: 1.3;
  color: #1976d2;
}

/* Content Section - Optimized for minimal scrolling */
.invoices-dialog-content {
  padding: 20px 24px;
  background: white;
  flex: 1;
  overflow-y: auto;
}

.section-header-compact {
  margin-bottom: 12px;
}

.section-title-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 0;
}

.section-icon {
  color: #1976d2;
  font-size: 18px;
}

/* Form Fields - Compact */
.form-field {
  margin-bottom: 12px;
}

.enhanced-field {
  transition: all 0.3s ease;
}

.enhanced-field:hover {
  transform: translateY(-1px);
}

.field-focused {
  background: rgba(25, 118, 210, 0.02);
  border-radius: 8px;
}

/* Enhanced Table - Compact */
.enhanced-table-compact {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(25, 118, 210, 0.1);
}

.enhanced-table-compact :deep(.v-data-table__wrapper) {
  border-radius: 8px;
}

.enhanced-table-compact :deep(th) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  color: #1976d2;
  font-weight: 600;
  border-bottom: 1px solid rgba(25, 118, 210, 0.1);
  padding: 8px 12px;
}

.enhanced-table-compact :deep(td) {
  padding: 6px 12px;
}

.enhanced-table-compact :deep(tr:hover) {
  background: rgba(25, 118, 210, 0.04);
}

.enhanced-table-compact :deep(tr:focus) {
  outline: 1px solid #1976d2;
  outline-offset: -1px;
}

/* Currency and Amount Styling */
.currency-symbol {
  font-weight: 600;
  color: #1976d2;
  font-size: 0.9rem;
}

.amount-value {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

/* Actions Section */
.dialog-actions-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-top: 1px solid #e0e0e0;
  padding: 16px 24px;
  gap: 12px;
}

.pos-action-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  padding: 12px 32px;
  min-width: 120px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pos-action-btn,
.pos-action-btn .v-icon,
.pos-action-btn span,
.pos-action-btn :deep(.v-btn__content) {
  color: white !important;
}

.cancel-action-btn {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%) !important;
}

.cancel-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(211, 47, 47, 0.4);
}

.submit-action-btn {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%) !important;
}

.submit-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 125, 50, 0.4);
}

.submit-action-btn:disabled {
  opacity: 0.6;
  transform: none;
}

.search-action-btn {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%) !important;
}

.search-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .invoices-dialog-header {
    padding: 12px 16px;
  }
  .header-content {
    gap: 8px;
  }
  .header-title {
    font-size: 1.2rem;
  }
  .invoices-dialog-content {
    padding: 16px;
  }
  .dialog-actions-container {
    padding: 12px 16px;
  }
  .pos-action-btn {
    padding: 10px 24px;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  .invoices-dialog-content {
    padding: 12px;
  }
  .pos-action-btn {
    padding: 8px 16px;
    min-width: 90px;
  }
}

/* Animation Effects */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.invoices-dialog-card {
  animation: slideInFromTop 0.4s ease-out;
}

/* Focus and Interaction States */
.enhanced-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.enhanced-field :deep(.v-field--focused .v-field__outline) {
  border-color: rgba(25, 118, 210, 0.3) !important;
  border-width: 1px !important;
}

.enhanced-field :deep(.v-field--focused .v-field__overlay) {
  background: rgba(25, 118, 210, 0.02);
}

.enhanced-table-compact :deep(.v-data-table-row--clickable:hover) {
  background: rgba(25, 118, 210, 0.04) !important;
}
</style>