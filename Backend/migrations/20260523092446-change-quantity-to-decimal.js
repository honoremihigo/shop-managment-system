module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('sales', 'quantity', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: false,
    });
    await queryInterface.changeColumn('stocks', 'quantity', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: false,
    });
    await queryInterface.changeColumn('purchased_items', 'quantity', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('sales', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn('stocks', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn('purchased_items', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  }
};