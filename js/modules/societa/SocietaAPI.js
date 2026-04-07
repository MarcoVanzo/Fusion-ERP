/**
 * Societa API Module
 */
export default {
    getProfile: () => Store.get("getProfile", "societa"),
    saveProfile: (data) => Store.api("saveProfile", "societa", data),
    uploadLogo: (formData) => Store.api("uploadLogo", "societa", formData),
    
    listCompanies: () => Store.get("listCompanies", "societa"),
    createCompany: (data) => Store.api("createCompany", "societa", data),
    updateCompany: (data) => Store.api("updateCompany", "societa", data),
    deleteCompany: (id) => Store.api("deleteCompany", "societa", { id }),
    uploadCompanyLogo: (formData) => Store.api("uploadCompanyLogo", "societa", formData),
    
    listRoles: () => Store.get("listRoles", "societa"),
    createRole: (data) => Store.api("createRole", "societa", data),
    updateRole: (data) => Store.api("updateRole", "societa", data),
    deleteRole: (id) => Store.api("deleteRole", "societa", { id }),
    
    listMembers: () => Store.get("listMembers", "societa"),
    createMember: (data) => Store.api("createMember", "societa", data),
    updateMember: (data) => Store.api("updateMember", "societa", data),
    deleteMember: (id) => Store.api("deleteMember", "societa", { id }),
    uploadMemberPhoto: (formData) => Store.api("uploadMemberPhoto", "societa", formData),
    
    listDocuments: () => Store.get("listDocuments", "societa"),
    uploadDocument: (formData) => Store.api("uploadDocument", "societa", formData),
    deleteDocument: (id) => Store.api("deleteDocument", "societa", { id }),
    
    listDeadlines: () => Store.get("listDeadlines", "societa"),
    createDeadline: (data) => Store.api("createDeadline", "societa", data),
    updateDeadline: (data) => Store.api("updateDeadline", "societa", data),
    deleteDeadline: (id) => Store.api("deleteDeadline", "societa", { id }),
    
    listSponsors: () => Store.get("listSponsors", "societa"),
    createSponsor: (data) => Store.api("createSponsor", "societa", data),
    updateSponsor: (data) => Store.api("updateSponsor", "societa", data),
    deleteSponsor: (id) => Store.api("deleteSponsor", "societa", { id }),
    uploadSponsorLogo: (formData) => Store.api("uploadSponsorLogo", "societa", formData),
    
    listTitoli: () => Store.get("listTitoli", "societa"),
    createTitolo: (data) => Store.api("createTitolo", "societa", data),
    updateTitolo: (data) => Store.api("updateTitolo", "societa", data),
    deleteTitolo: (id) => Store.api("deleteTitolo", "societa", { id }),
    
    getForesteria: () => Store.get("getForesteria", "societa"),
    saveForesteria: (data) => Store.api("saveForesteria", "societa", data),
    addExpense: (data) => Store.api("addExpense", "societa", data),
    deleteExpense: (id) => Store.api("deleteExpense", "societa", { id }),
    uploadForesteriaMedia: (formData) => Store.api("uploadForesteriaMedia", "societa", formData),
    addForesteriaYoutubeLink: (data) => Store.api("addForesteriaYoutubeLink", "societa", data),
    deleteForesteriaMedia: (id) => Store.api("deleteForesteriaMedia", "societa", { id })
};
