module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sales', 'payment_method', {
      type: Sequelize.ENUM('cash', 'mobile_money', 'credit'),
      allowNull: false,
      defaultValue: 'cash',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('sales', 'payment_method');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_sales_payment_method;');
  }
};