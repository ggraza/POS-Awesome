# Copyright (c) 2025, Youssef Restom and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import add_days

class ShopOrder(Document):
    pass


@frappe.whitelist()
def get_sales_invoice_qty(item_code, company, posting_date):
    posting_date = add_days(posting_date, -6)
    qty = frappe.db.sql("""
        SELECT SUM(sii.qty) as total_qty
        FROM `tabSales Invoice Item` sii
        INNER JOIN `tabSales Invoice` si ON sii.parent = si.name
        WHERE sii.item_code = %s
        AND si.docstatus = 1
        AND si.company = %s
        AND si.posting_date = %s
    """, (item_code, company, posting_date))[0][0] or 0
    return qty