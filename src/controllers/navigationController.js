// backend/src/controllers/navigationController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all navigation menus
const getNavigationMenus = async (req, res) => {
  try {
    const menus = await prisma.navigationMenu.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    
    // Build hierarchical structure
    const mainMenus = menus.filter(m => !m.parentId);
    const dropdowns = menus.filter(m => m.parentId);
    
    const result = mainMenus.map(menu => {
      if (menu.isDropdown) {
        return {
          ...menu,
          dropdownItems: dropdowns.filter(d => d.parentId === menu.id)
        };
      }
      return menu;
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get navigation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create navigation menu (Admin)
const createNavigationMenu = async (req, res) => {
  try {
    const { name, path, icon, parentId, order, isActive, isDropdown, dropdownItems } = req.body;
    
    const menu = await prisma.navigationMenu.create({
      data: {
        name,
        path,
        icon: icon || null,
        parentId: parentId || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        isDropdown: isDropdown || false,
        dropdownItems: dropdownItems || null
      }
    });
    
    res.status(201).json({ success: true, data: menu, message: 'Menu created successfully' });
  } catch (error) {
    console.error('Create navigation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update navigation menu (Admin)
const updateNavigationMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, path, icon, parentId, order, isActive, isDropdown, dropdownItems } = req.body;
    
    const menu = await prisma.navigationMenu.update({
      where: { id },
      data: {
        name,
        path,
        icon,
        parentId,
        order,
        isActive,
        isDropdown,
        dropdownItems
      }
    });
    
    res.json({ success: true, data: menu, message: 'Menu updated successfully' });
  } catch (error) {
    console.error('Update navigation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete navigation menu (Admin)
const deleteNavigationMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.navigationMenu.delete({ where: { id } });
    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Delete navigation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getNavigationMenus, createNavigationMenu, updateNavigationMenu, deleteNavigationMenu };